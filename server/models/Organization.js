import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Healthcare', 'Government', 'Education', 'Banking', 'Customer Service', 'Other'],
      default: 'Healthcare',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Organization = mongoose.model('Organization', organizationSchema);
