import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    organizationId: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['ORGANIZATION_ADMIN', 'QUEUE_MANAGER', 'OPERATOR', 'VIEWER'],
      default: 'OPERATOR',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee unique membership per user per organization
membershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });

export const Membership = mongoose.model('Membership', membershipSchema);
