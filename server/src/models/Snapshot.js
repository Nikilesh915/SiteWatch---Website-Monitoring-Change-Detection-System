import mongoose from 'mongoose';

const snapshotSchema = new mongoose.Schema({
  monitorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Monitor',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  pageTitle: {
    type: String,
    default: '',
  },
  extractedText: {
    type: String,
    required: true,
  },
  contentHash: {
    type: String,
    required: true,
    index: true,
  },
  contentLength: {
    type: Number,
    required: true,
  },
  statusCode: {
    type: Number,
    default: 200,
  },
  responseTime: {
    type: Number, // in ms
    default: 0,
  },
  hasChange: {
    type: Boolean,
    default: false,
  }
});

// Index to retrieve recent snapshots for a monitor quickly
snapshotSchema.index({ monitorId: 1, timestamp: -1 });

export default mongoose.model('Snapshot', snapshotSchema);
