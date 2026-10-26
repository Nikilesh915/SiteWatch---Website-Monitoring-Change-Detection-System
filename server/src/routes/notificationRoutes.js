import express from 'express';
import NotificationLog from '../models/NotificationLog.js';
import { protect } from '../middleware/authMiddleware.js';
import { sendTestAlert } from '../services/notificationService.js';

const router = express.Router();

router.use(protect);

// @route   GET /api/notifications
// @desc    Get user's notification log history
router.get('/', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const notifications = await NotificationLog.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    const unreadCount = await NotificationLog.countDocuments({
      userId: req.user._id,
      read: false,
    });

    res.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PATCH /api/notifications/:id/read
// @desc    Mark a notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await NotificationLog.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/notifications/read-all
// @desc    Mark all notifications as read
router.post('/read-all', async (req, res) => {
  try {
    await NotificationLog.updateMany(
      { userId: req.user._id, read: false },
      { read: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/notifications/test
// @desc    Send a test notification
router.post('/test', async (req, res) => {
  try {
    const { targetEmail } = req.body;
    const result = await sendTestAlert(req.user, targetEmail);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: `Failed to dispatch test notification: ${result.error}`,
      });
    }

    res.json({
      success: true,
      message: `Test alert sent to ${result.recipient}`,
      previewUrl: result.previewUrl,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
