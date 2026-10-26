import mongoose from 'mongoose';

const notificationLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  monitorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Monitor',
    required: true,
  },
  monitorName: {
    type: String,
    required: true,
  },
  monitorUrl: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    enum: ['change_detected', 'site_down', 'site_recovered', 'test_email'],
    default: 'change_detected',
  },
  subject: {
    type: String,
    required: true,
  },
  recipient: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
  deliveryStatus: {
    type: String,
    enum: ['delivered', 'preview_mode', 'failed'],
    default: 'delivered',
  },
  previewUrl: {
    type: String,
    default: null,
  },
  read: {
    type: Boolean,
    default: false,
  }
});

notificationLogSchema.index({ userId: 1, timestamp: -1 });

export default mongoose.model('NotificationLog', notificationLogSchema);
