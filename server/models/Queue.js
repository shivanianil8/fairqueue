import mongoose from 'mongoose';

const queueSchema = new mongoose.Schema(
  {
    organizationId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      default: 'General',
    },
    description: {
      type: String,
      default: '',
    },
    prefix: {
      type: String,
      default: 'Q',
      uppercase: true,
      trim: true,
    },
    settings: {
      targetServiceMinutes: { type: Number, default: 15 },
      activeCounterCount: { type: Number, default: 2 },
      status: { type: String, enum: ['ACTIVE', 'PAUSED'], default: 'ACTIVE' },
    },
  },
  {
    timestamps: true,
  }
);

export const Queue = mongoose.model('Queue', queueSchema);
