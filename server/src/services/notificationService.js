import nodemailer from 'nodemailer';
import NotificationLog from '../models/NotificationLog.js';
import { createDiffSnippet } from './diffService.js';

let transporterInstance = null;
let isEthereal = false;

/**
 * Initializes and returns the Nodemailer transporter
 */
const getTransporter = async () => {
  if (transporterInstance) {
    return transporterInstance;
  }

  // If user provided SMTP credentials in environment
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporterInstance = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log(`[Email] Configured custom SMTP transporter (${process.env.SMTP_HOST}).`);
    return transporterInstance;
  }

  // Otherwise, create an Ethereal test account automatically for local development
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporterInstance = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    isEthereal = true;
    console.log(`[Email] Ethereal test email account initialized (${testAccount.user}).`);
    return transporterInstance;
  } catch (err) {
    console.warn(`[Email] Could not create Ethereal account (${err.message}). Falling back to simulated email mode.`);
    return null;
  }
};

/**
 * Generates modern HTML template for change alerts
 */
const generateEmailTemplate = ({ monitorName, monitorUrl, summary, diffSnippet, timestamp, dashboardUrl }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #e2e8f0; margin: 0; padding: 24px; }
        .container { max-width: 620px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4); }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 24px 30px; text-align: left; }
        .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .content { padding: 30px; }
        .badge { display: inline-block; background-color: #f59e0b; color: #1e1b4b; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px; }
        .monitor-card { background-color: #0f172a; border-radius: 8px; padding: 18px; border: 1px solid #334155; margin-bottom: 24px; }
        .monitor-card h2 { margin: 0 0 6px 0; font-size: 18px; color: #f8fafc; }
        .monitor-url { color: #818cf8; text-decoration: none; font-size: 14px; word-break: break-all; }
        .summary-box { background: rgba(99, 102, 241, 0.1); border-left: 4px solid #6366f1; padding: 12px 16px; margin: 18px 0; border-radius: 0 8px 8px 0; }
        .summary-title { font-size: 14px; font-weight: 600; color: #c7d2fe; margin-bottom: 4px; }
        .summary-val { font-size: 15px; color: #ffffff; }
        .diff-container { background-color: #090d16; border-radius: 8px; padding: 16px; font-family: 'JetBrains Mono', Consolas, monospace; font-size: 13px; line-height: 1.5; overflow-x: auto; border: 1px solid #1e293b; margin-bottom: 24px; white-space: pre-wrap; }
        .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; }
        .footer { padding: 20px 30px; background-color: #172033; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #334155; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SiteWatch Alert</h1>
        </div>
        <div class="content">
          <span class="badge">Change Detected</span>
          <div class="monitor-card">
            <h2>${monitorName}</h2>
            <a href="${monitorUrl}" class="monitor-url" target="_blank">${monitorUrl}</a>
          </div>

          <div class="summary-box">
            <div class="summary-title">Detection Summary</div>
            <div class="summary-val">${summary}</div>
          </div>

          <p style="color: #94a3b8; font-size: 14px; margin-bottom: 8px;">Snippet of detected changes:</p>
          <div class="diff-container">${diffSnippet || 'Content difference detected.'}</div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${dashboardUrl}" class="btn">View Full Visual Diff & History</a>
          </div>
        </div>
        <div class="footer">
          Detected on ${new Date(timestamp).toLocaleString()} UTC • Monitored with SiteWatch
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Sends change alert email and logs to database
 */
export const sendChangeAlert = async ({ user, monitor, changeLog, diffChunks }) => {
  const recipient = monitor.notifyEmail || user.alertEmail || user.email;
  
  if (!recipient || !monitor.notifyEnabled) {
    return { sent: false, reason: 'Notifications disabled or no recipient' };
  }

  const subject = `[SiteWatch Alert] Changes detected on ${monitor.name}`;
  const diffSnippet = createDiffSnippet(diffChunks, 8);
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const dashboardUrl = `${clientUrl}/monitors/${monitor._id}`;

  const htmlContent = generateEmailTemplate({
    monitorName: monitor.name,
    monitorUrl: monitor.url,
    summary: changeLog.summary,
    diffSnippet,
    timestamp: changeLog.timestamp,
    dashboardUrl,
  });

  try {
    const transporter = await getTransporter();
    let previewUrl = null;
    let deliveryStatus = 'delivered';

    if (transporter) {
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"SiteWatch Alerts" <alerts@sitewatch.io>',
        to: recipient,
        subject,
        text: `Changes detected on ${monitor.name} (${monitor.url}):\n\n${changeLog.summary}\n\n${diffSnippet}\n\nView details: ${dashboardUrl}`,
        html: htmlContent,
      });

      if (isEthereal) {
        previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`[Email] Alert email preview URL: ${previewUrl}`);
        deliveryStatus = 'preview_mode';
      }
    } else {
      deliveryStatus = 'preview_mode';
    }

    // Save to NotificationLog for in-app inbox
    await NotificationLog.create({
      userId: user._id,
      monitorId: monitor._id,
      monitorName: monitor.name,
      monitorUrl: monitor.url,
      type: 'change_detected',
      subject,
      recipient,
      summary: changeLog.summary,
      deliveryStatus,
      previewUrl,
    });

    return { sent: true, recipient, previewUrl };
  } catch (error) {
    console.error('[Email] Failed to send change alert:', error.message);
    
    // Still record failed attempt in logs
    await NotificationLog.create({
      userId: user._id,
      monitorId: monitor._id,
      monitorName: monitor.name,
      monitorUrl: monitor.url,
      type: 'change_detected',
      subject,
      recipient,
      summary: `Failed to deliver: ${error.message}`,
      deliveryStatus: 'failed',
    });

    return { sent: false, error: error.message };
  }
};

/**
 * Sends a test email to verify configuration
 */
export const sendTestAlert = async (user, targetEmail) => {
  const recipient = targetEmail || user.alertEmail || user.email;
  const subject = '[SiteWatch] Test Alert Notification';
  const transporter = await getTransporter();

  try {
    let previewUrl = null;
    let deliveryStatus = 'delivered';

    if (transporter) {
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"SiteWatch" <alerts@sitewatch.io>',
        to: recipient,
        subject,
        text: 'This is a test notification from SiteWatch. Your alerts are properly configured!',
        html: `
          <div style="font-family: sans-serif; background-color: #0f172a; color: #fff; padding: 24px; border-radius: 8px;">
            <h2 style="color: #6366f1;">SiteWatch Test Notification</h2>
            <p>Your notification system is working correctly. You will receive updates here whenever monitored sites change.</p>
          </div>
        `,
      });

      if (isEthereal) {
        previewUrl = nodemailer.getTestMessageUrl(info);
      }
    } else {
      deliveryStatus = 'preview_mode';
    }

    const log = await NotificationLog.create({
      userId: user._id,
      monitorId: user._id, // placeholder
      monitorName: 'System Test',
      monitorUrl: 'https://sitewatch.io',
      type: 'test_email',
      subject,
      recipient,
      summary: 'Test notification executed successfully',
      deliveryStatus,
      previewUrl,
    });

    return { success: true, recipient, previewUrl, log };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
