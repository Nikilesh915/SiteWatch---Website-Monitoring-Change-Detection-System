import cron from 'node-cron';
import Monitor from '../models/Monitor.js';
import Snapshot from '../models/Snapshot.js';
import ChangeLog from '../models/ChangeLog.js';
import User from '../models/User.js';
import { scrapePage } from './scraperService.js';
import { computeDiff } from './diffService.js';
import { sendChangeAlert } from './notificationService.js';

let cronJob = null;
let isJobRunning = false;

/**
 * Maps interval string to milliseconds
 */
const intervalToMs = (interval) => {
  switch (interval) {
    case '1m': return 1 * 60 * 1000;
    case '5m': return 5 * 60 * 1000;
    case '15m': return 15 * 60 * 1000;
    case '30m': return 30 * 60 * 1000;
    case '1h': return 60 * 60 * 1000;
    case '6h': return 6 * 60 * 60 * 1000;
    case '12h': return 12 * 60 * 60 * 1000;
    case '24h': return 24 * 60 * 60 * 1000;
    default: return 15 * 60 * 1000;
  }
};

/**
 * Runs a check for an individual monitor
 */
export const checkSingleMonitor = async (monitorId) => {
  const monitor = await Monitor.findById(monitorId);
  if (!monitor) {
    throw new Error('Monitor not found');
  }

  // Update status to checking
  monitor.status = 'checking';
  await monitor.save();

  // Scrape page content
  const scrapeResult = await scrapePage(monitor.url, monitor.selector, monitor.ignoreWhitespace);

  if (!scrapeResult.success) {
    monitor.status = 'error';
    monitor.errorMessage = scrapeResult.error;
    monitor.lastCheckedAt = new Date();
    monitor.lastStatusCode = scrapeResult.statusCode;
    monitor.lastResponseTime = scrapeResult.responseTime;
    await monitor.save();
    return {
      status: 'error',
      message: scrapeResult.error,
      statusCode: scrapeResult.statusCode,
      monitor,
    };
  }

  // Find previous latest snapshot
  const previousSnapshot = await Snapshot.findOne({ monitorId: monitor._id }).sort({ timestamp: -1 });

  const now = new Date();
  let changeDetected = false;
  let changeLogEntry = null;

  if (!previousSnapshot) {
    // Initial baseline capture
    const initialSnapshot = await Snapshot.create({
      monitorId: monitor._id,
      userId: monitor.userId,
      timestamp: now,
      pageTitle: scrapeResult.title,
      extractedText: scrapeResult.extractedText,
      contentHash: scrapeResult.contentHash,
      contentLength: scrapeResult.contentLength,
      statusCode: scrapeResult.statusCode,
      responseTime: scrapeResult.responseTime,
      hasChange: false,
    });

    monitor.status = 'active';
    monitor.lastHash = scrapeResult.contentHash;
    monitor.lastStatusCode = scrapeResult.statusCode;
    monitor.lastResponseTime = scrapeResult.responseTime;
    monitor.lastContentLength = scrapeResult.contentLength;
    monitor.lastCheckedAt = now;
    monitor.errorMessage = null;
    await monitor.save();

    return {
      status: 'baseline_created',
      message: 'Initial baseline snapshot created',
      snapshot: initialSnapshot,
      monitor,
    };
  }

  // Check if hash matches
  if (previousSnapshot.contentHash === scrapeResult.contentHash) {
    // No change detected
    monitor.status = 'active';
    monitor.lastStatusCode = scrapeResult.statusCode;
    monitor.lastResponseTime = scrapeResult.responseTime;
    monitor.lastCheckedAt = now;
    monitor.errorMessage = null;
    await monitor.save();

    return {
      status: 'no_change',
      message: 'No changes detected',
      statusCode: scrapeResult.statusCode,
      responseTime: scrapeResult.responseTime,
      monitor,
    };
  }

  // Content changed! Compute diff
  const diffResult = await computeDiff(previousSnapshot.extractedText, scrapeResult.extractedText);

  if (diffResult.hasChanges) {
    changeDetected = true;

    // Create new snapshot
    const currentSnapshot = await Snapshot.create({
      monitorId: monitor._id,
      userId: monitor.userId,
      timestamp: now,
      pageTitle: scrapeResult.title,
      extractedText: scrapeResult.extractedText,
      contentHash: scrapeResult.contentHash,
      contentLength: scrapeResult.contentLength,
      statusCode: scrapeResult.statusCode,
      responseTime: scrapeResult.responseTime,
      hasChange: true,
    });

    // Create change log entry
    changeLogEntry = await ChangeLog.create({
      monitorId: monitor._id,
      userId: monitor.userId,
      timestamp: now,
      previousSnapshotId: previousSnapshot._id,
      currentSnapshotId: currentSnapshot._id,
      summary: diffResult.summary,
      addedLinesCount: diffResult.addedLinesCount,
      deletedLinesCount: diffResult.deletedLinesCount,
      percentageChange: diffResult.percentageChange,
      diffChunks: diffResult.diffChunks,
      notificationSent: false,
    });

    // Update monitor details
    monitor.status = 'changed';
    monitor.lastHash = scrapeResult.contentHash;
    monitor.lastContentLength = scrapeResult.contentLength;
    monitor.lastStatusCode = scrapeResult.statusCode;
    monitor.lastResponseTime = scrapeResult.responseTime;
    monitor.lastCheckedAt = now;
    monitor.lastChangedAt = now;
    monitor.changeCount = (monitor.changeCount || 0) + 1;
    monitor.errorMessage = null;
    await monitor.save();

    // Trigger notification
    const user = await User.findById(monitor.userId);
    if (user && monitor.notifyEnabled) {
      const alertResult = await sendChangeAlert({
        user,
        monitor,
        changeLog: changeLogEntry,
        diffChunks: diffResult.diffChunks,
      });

      if (alertResult.sent) {
        changeLogEntry.notificationSent = true;
        await changeLogEntry.save();
      }
    }

    return {
      status: 'changed',
      message: `Change detected: ${diffResult.summary}`,
      changeLog: changeLogEntry,
      diff: diffResult,
      monitor,
    };
  } else {
    // False positive or trivial change (e.g. hash differed due to formatting, but line diff found no meaningful change)
    monitor.status = 'active';
    monitor.lastStatusCode = scrapeResult.statusCode;
    monitor.lastResponseTime = scrapeResult.responseTime;
    monitor.lastCheckedAt = now;
    monitor.errorMessage = null;
    await monitor.save();

    return {
      status: 'no_change',
      message: 'No substantive changes found',
      monitor,
    };
  }
};

/**
 * Checks all active monitors that are due for inspection
 */
export const runScheduledChecks = async () => {
  if (isJobRunning) {
    console.log('[Scheduler] Previous check cycle still in progress, skipping tick.');
    return;
  }

  isJobRunning = true;
  const now = Date.now();

  try {
    const activeMonitors = await Monitor.find({ isActive: true });
    
    // Filter monitors that are due for a check
    const dueMonitors = activeMonitors.filter(m => {
      if (!m.lastCheckedAt) return true; // Never checked before
      const intervalMs = intervalToMs(m.interval);
      return (now - new Date(m.lastCheckedAt).getTime()) >= intervalMs;
    });

    if (dueMonitors.length > 0) {
      console.log(`[Scheduler] Checking ${dueMonitors.length} due monitor(s)...`);

      // Process in controlled chunks of 5 monitors concurrently
      const chunkSize = 5;
      for (let i = 0; i < dueMonitors.length; i += chunkSize) {
        const chunk = dueMonitors.slice(i, i + chunkSize);
        await Promise.allSettled(
          chunk.map(m => checkSingleMonitor(m._id).catch(err => {
            console.error(`[Scheduler] Error checking monitor ${m._id}:`, err.message);
          }))
        );
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error in runScheduledChecks:', error.message);
  } finally {
    isJobRunning = false;
  }
};

/**
 * Starts the global cron job (runs every minute to evaluate due monitors)
 */
export const startScheduler = () => {
  if (cronJob) {
    cronJob.stop();
  }

  // Schedule task every minute
  cronJob = cron.schedule('* * * * *', () => {
    runScheduledChecks();
  });

  console.log('[Scheduler] Node-cron monitoring scheduler active (evaluating every 60s).');
};

/**
 * Stops the scheduler
 */
export const stopScheduler = () => {
  if (cronJob) {
    cronJob.stop();
    console.log('[Scheduler] Scheduler stopped.');
  }
};
