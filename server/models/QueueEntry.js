import mongoose from 'mongoose';

const queueEntrySchema = new mongoose.Schema(
  {
    organizationId: {
      type: String,
      required: true,
      index: true,
    },
    queueId: {
      type: String,
      required: true,
      index: true,
    },
    personId: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    waitingTime: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
    appointmentStatus: {
      type: String,
      enum: ['scheduled', 'walkin', 'missed'],
      default: 'walkin',
    },
    specialRequirement: {
      type: String,
      enum: ['none', 'elderly', 'disability', 'emergency', 'other'],
      default: 'none',
    },
    arrivalTime: {
      type: String,
      default: () => {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      },
    },
    status: {
      type: String,
      enum: ['WAITING', 'CALLED', 'IN_SERVICE', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
      default: 'WAITING',
      index: true,
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'normal', 'unassigned'],
      default: 'unassigned',
    },
    recommendedRank: {
      type: Number,
      default: null,
    },
    explanation: {
      type: String,
      default: '',
    },
    rulesTriggered: {
      type: [String],
      default: [],
    },
    isOverridden: {
      type: Boolean,
      default: false,
    },
    overrideDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    servedBy: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    calledAt: { type: Date, default: null },
    serviceStartedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queue lookups
queueEntrySchema.index({ organizationId: 1, queueId: 1, status: 1 });

export const QueueEntry = mongoose.model('QueueEntry', queueEntrySchema);
