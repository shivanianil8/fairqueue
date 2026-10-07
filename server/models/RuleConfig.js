import mongoose from 'mongoose';

const ruleConfigSchema = new mongoose.Schema({
  configId: {
    type: String,
    default: 'default_config',
    unique: true,
  },
  criticalWait: {
    type: Number,
    default: 60,
  },
  longWait: {
    type: Number,
    default: 30,
  },
  vulnerableWait: {
    type: Number,
    default: 20,
  },
  moderateWait: {
    type: Number,
    default: 15,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export const RuleConfig = mongoose.model('RuleConfig', ruleConfigSchema);
