import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['ORGANIZATION_ADMIN', 'QUEUE_MANAGER', 'OPERATOR', 'VIEWER'],
      default: 'OPERATOR',
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    invitedBy: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Invitation = mongoose.model('Invitation', invitationSchema);
