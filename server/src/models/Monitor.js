import mongoose from 'mongoose';

const monitorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Please provide a monitor name'],
    trim: true,
  },
  url: {
    type: String,
    required: [true, 'Please provide a URL to monitor'],
    trim: true,
  },
  selector: {
    type: String,
    trim: true,
    default: '', // empty means extract main body content
  },
  interval: {
    type: String,
    enum: ['1m', '5m', '15m', '30m', '1h', '6h', '12h', '24h'],
    default: '15m',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'error', 'changed', 'checking', 'pending'],
    default: 'pending',
  },
  errorMessage: {
    type: String,
    default: null,
  },
  lastStatusCode: {
    type: Number,
    default: null,
  },
  lastResponseTime: {
    type: Number, // in milliseconds
    default: null,
  },
  lastCheckedAt: {
    type: Date,
    default: null,
  },
  lastChangedAt: {
    type: Date,
    default: null,
  },
  lastHash: {
    type: String,
    default: null,
  },
  lastContentLength: {
    type: Number,
    default: 0,
  },
  notifyEmail: {
    type: String,
    trim: true,
    default: '',
  },
  notifyEnabled: {
    type: Boolean,
    default: true,
  },
  ignoreWhitespace: {
    type: Boolean,
    default: true,
  },
  tags: {
    type: [String],
    default: ['General'],
  },
  changeCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Indexes for fast lookup
monitorSchema.index({ userId: 1, isActive: 1 });
monitorSchema.index({ isActive: 1, interval: 1 });

export default mongoose.model('Monitor', monitorSchema);
