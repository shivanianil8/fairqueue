import mongoose from 'mongoose';

const personSchema = new mongoose.Schema({
  personId: {
    type: String,
    required: true,
    unique: true,
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
  priority: {
    type: String,
    enum: ['high', 'medium', 'normal', 'unassigned'],
    default: 'unassigned',
  },
  lastExplanation: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Person = mongoose.model('Person', personSchema);
