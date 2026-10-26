import express from 'express';
import Monitor from '../models/Monitor.js';
import Snapshot from '../models/Snapshot.js';
import ChangeLog from '../models/ChangeLog.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkSingleMonitor } from '../services/schedulerService.js';
import { scrapePage } from '../services/scraperService.js';

const router = express.Router();

// Apply protect middleware to all routes in this router
router.use(protect);

// @route   GET /api/monitors
// @desc    Get all monitors for user with dashboard metrics
router.get('/', async (req, res) => {
  try {
    const { search, tag, status } = req.query;

    const query = { userId: req.user._id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { url: { $regex: search, $options: 'i' } }
      ];
    }

    if (tag && tag !== 'All') {
      query.tags = tag;
    }

    if (status && status !== 'all') {
      if (status === 'paused') query.isActive = false;
      else if (status === 'active') query.isActive = true;
      else query.status = status;
    }

    const monitors = await Monitor.find(query).sort({ createdAt: -1 });

    // Compute aggregated metrics for dashboard
    const allUserMonitors = await Monitor.find({ userId: req.user._id });
    const totalMonitors = allUserMonitors.length;
    const activeMonitors = allUserMonitors.filter(m => m.isActive).length;
    const errorMonitors = allUserMonitors.filter(m => m.status === 'error').length;
    
    // Changes in last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const changes24h = await ChangeLog.countDocuments({
      userId: req.user._id,
      timestamp: { $gte: yesterday },
    });

    // Average response time
    const monitorsWithTiming = allUserMonitors.filter(m => m.lastResponseTime && m.lastResponseTime > 0);
    const avgResponseTime = monitorsWithTiming.length > 0
      ? Math.round(monitorsWithTiming.reduce((sum, m) => sum + m.lastResponseTime, 0) / monitorsWithTiming.length)
      : 0;

    res.json({
      success: true,
      data: monitors,
      metrics: {
        totalMonitors,
        activeMonitors,
        pausedMonitors: totalMonitors - activeMonitors,
        errorMonitors,
        changes24h,
        avgResponseTime,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/monitors/preview-scrape
// @desc    Test scraping a URL & CSS selector live
router.post('/preview-scrape', async (req, res) => {
  try {
    const { url, selector, ignoreWhitespace } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required for preview' });
    }

    const result = await scrapePage(url, selector, ignoreWhitespace !== false);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/monitors
// @desc    Create a new monitor & trigger baseline check
router.post('/', async (req, res) => {
  try {
    const {
      name,
      url,
      selector,
      interval,
      notifyEmail,
      notifyEnabled,
      ignoreWhitespace,
      tags,
    } = req.body;

    if (!name || !url) {
      return res.status(400).json({ success: false, message: 'Name and URL are required' });
    }

    const monitor = await Monitor.create({
      userId: req.user._id,
      name,
      url,
      selector: selector || '',
      interval: interval || '15m',
      notifyEmail: notifyEmail || req.user.alertEmail || req.user.email,
      notifyEnabled: notifyEnabled !== false,
      ignoreWhitespace: ignoreWhitespace !== false,
      tags: Array.isArray(tags) && tags.length > 0 ? tags : ['General'],
    });

    // Run initial baseline check immediately in background
    checkSingleMonitor(monitor._id).catch(err => {
      console.warn(`[Monitor] Baseline check error for ${monitor.name}:`, err.message);
    });

    res.status(201).json({
      success: true,
      data: monitor,
      message: 'Monitor created successfully. Baseline capture in progress.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/monitors/:id
// @desc    Get single monitor details
router.get('/:id', async (req, res) => {
  try {
    const monitor = await Monitor.findOne({ _id: req.params.id, userId: req.user._id });
    if (!monitor) {
      return res.status(404).json({ success: false, message: 'Monitor not found' });
    }

    // Recent 5 changes
    const recentChanges = await ChangeLog.find({ monitorId: monitor._id })
      .sort({ timestamp: -1 })
      .limit(5);

    // Latest snapshot
    const latestSnapshot = await Snapshot.findOne({ monitorId: monitor._id })
      .sort({ timestamp: -1 });

    res.json({
      success: true,
      data: {
        monitor,
        recentChanges,
        latestSnapshot,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/monitors/:id
// @desc    Update monitor
router.put('/:id', async (req, res) => {
  try {
    const monitor = await Monitor.findOne({ _id: req.params.id, userId: req.user._id });
    if (!monitor) {
      return res.status(404).json({ success: false, message: 'Monitor not found' });
    }

    const fields = [
      'name', 'url', 'selector', 'interval', 'isActive',
      'notifyEmail', 'notifyEnabled', 'ignoreWhitespace', 'tags'
    ];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        monitor[field] = req.body[field];
      }
    });

    await monitor.save();

    res.json({
      success: true,
      data: monitor,
      message: 'Monitor updated successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/monitors/:id
// @desc    Delete monitor and cascade related data
router.delete('/:id', async (req, res) => {
  try {
    const monitor = await Monitor.findOne({ _id: req.params.id, userId: req.user._id });
    if (!monitor) {
      return res.status(404).json({ success: false, message: 'Monitor not found' });
    }

    await Snapshot.deleteMany({ monitorId: monitor._id });
    await ChangeLog.deleteMany({ monitorId: monitor._id });
    await Monitor.deleteOne({ _id: monitor._id });

    res.json({
      success: true,
      message: 'Monitor and all associated snapshots and change records deleted',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/monitors/:id/check
// @desc    Trigger an immediate check for monitor
router.post('/:id/check', async (req, res) => {
  try {
    const monitor = await Monitor.findOne({ _id: req.params.id, userId: req.user._id });
    if (!monitor) {
      return res.status(404).json({ success: false, message: 'Monitor not found' });
    }

    const result = await checkSingleMonitor(monitor._id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/monitors/:id/toggle
// @desc    Toggle monitor active / paused status
router.post('/:id/toggle', async (req, res) => {
  try {
    const monitor = await Monitor.findOne({ _id: req.params.id, userId: req.user._id });
    if (!monitor) {
      return res.status(404).json({ success: false, message: 'Monitor not found' });
    }

    monitor.isActive = !monitor.isActive;
    monitor.status = monitor.isActive ? 'active' : 'paused';
    await monitor.save();

    res.json({
      success: true,
      data: monitor,
      message: `Monitor ${monitor.isActive ? 'activated' : 'paused'} successfully`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/monitors/:id/snapshots
// @desc    Get snapshot history for a monitor
router.get('/:id/snapshots', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const snapshots = await Snapshot.find({
      monitorId: req.params.id,
      userId: req.user._id,
    })
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .select('-extractedText'); // omit large text from list overview

    res.json({
      success: true,
      data: snapshots,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/monitors/:id/snapshots/:snapshotId
// @desc    Get full snapshot content
router.get('/:id/snapshots/:snapshotId', async (req, res) => {
  try {
    const snapshot = await Snapshot.findOne({
      _id: req.params.snapshotId,
      monitorId: req.params.id,
      userId: req.user._id,
    });

    if (!snapshot) {
      return res.status(404).json({ success: false, message: 'Snapshot not found' });
    }

    res.json({
      success: true,
      data: snapshot,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/monitors/:id/changes
// @desc    Get all change logs and diffs for a monitor
router.get('/:id/changes', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const changes = await ChangeLog.find({
      monitorId: req.params.id,
      userId: req.user._id,
    })
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .populate('previousSnapshotId', 'timestamp contentLength statusCode')
      .populate('currentSnapshotId', 'timestamp contentLength statusCode');

    res.json({
      success: true,
      data: changes,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/monitors/:id/changes/:changeId
// @desc    Get detailed diff for a specific change event
router.get('/:id/changes/:changeId', async (req, res) => {
  try {
    const change = await ChangeLog.findOne({
      _id: req.params.changeId,
      monitorId: req.params.id,
      userId: req.user._id,
    })
      .populate('previousSnapshotId')
      .populate('currentSnapshotId');

    if (!change) {
      return res.status(404).json({ success: false, message: 'Change record not found' });
    }

    res.json({
      success: true,
      data: change,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
