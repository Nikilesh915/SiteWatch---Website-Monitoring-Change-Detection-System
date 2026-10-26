import mongoose from 'mongoose';

const changeLogSchema = new mongoose.Schema({
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
  previousSnapshotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Snapshot',
    required: true,
  },
  currentSnapshotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Snapshot',
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
  addedLinesCount: {
    type: Number,
    default: 0,
  },
  deletedLinesCount: {
    type: Number,
    default: 0,
  },
  percentageChange: {
    type: Number,
    default: 0,
  },
  diffChunks: [
    {
      type: {
        type: String,
        enum: ['added', 'removed', 'unchanged'],
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
      lineCount: {
        type: Number,
        default: 1,
      }
    }
  ],
  notificationSent: {
    type: Boolean,
    default: false,
  },
  notificationError: {
    type: String,
    default: null,
  }
});

changeLogSchema.index({ monitorId: 1, timestamp: -1 });

export default mongoose.model('ChangeLog', changeLogSchema);
