import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema({
  analysisId: {
    type: String,
    required: true,
    unique: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  totalPeople: {
    type: Number,
    required: true,
  },
  highPriorityCount: {
    type: Number,
    default: 0,
  },
  mediumPriorityCount: {
    type: Number,
    default: 0,
  },
  normalPriorityCount: {
    type: Number,
    default: 0,
  },
  averageWaitTime: {
    type: Number,
    default: 0,
  },
  engineUsed: {
    type: String,
    default: 'SWI-Prolog / ISO Prolog',
  },
  thresholds: {
    type: Map,
    of: Number,
    default: {},
  },
  rankedQueue: {
    type: Array,
    required: true,
  },
  prologFactsUsed: {
    type: String,
    default: '',
  },
  rawQuery: {
    type: String,
    default: 'rank_all_people(RankedList).',
  },
});

export const Analysis = mongoose.model('Analysis', analysisSchema);
