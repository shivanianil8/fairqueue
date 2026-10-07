import { dbService } from '../services/dbService.js';
import { prologService } from '../services/prologService.js';

export const rulesController = {
  async getRules(req, res) {
    try {
      const queueId = req.query.queueId || 'default';
      const organizationId = req.organizationId;

      const ruleDefinitions = prologService.getRuleDefinitions();
      const currentConfig = await dbService.getRuleConfig(queueId, organizationId);
      const queueRules = await dbService.getQueueRules(queueId, organizationId);

      res.json({
        success: true,
        version: queueRules?.version || 'v1.0',
        rules: ruleDefinitions,
        thresholds: {
          criticalWait: currentConfig.criticalWait,
          longWait: currentConfig.longWait,
          vulnerableWait: currentConfig.vulnerableWait,
          moderateWait: currentConfig.moderateWait,
        },
        metadata: {
          totalRules: ruleDefinitions.length,
          highPriorityRules: ruleDefinitions.filter(r => r.tier === 'HIGH').length,
          mediumPriorityRules: ruleDefinitions.filter(r => r.tier === 'MEDIUM').length,
          normalPriorityRules: ruleDefinitions.filter(r => r.tier === 'NORMAL').length,
          disclaimer: 'These are configurable organization rules evaluated via Prolog Horn clauses.',
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async updateThresholds(req, res) {
    try {
      const queueId = req.query.queueId || req.body.queueId || 'default';
      const organizationId = req.organizationId;
      const { criticalWait, longWait, vulnerableWait, moderateWait } = req.body;

      const updates = {};
      if (criticalWait !== undefined) {
        const val = parseInt(criticalWait, 10);
        if (isNaN(val) || val <= 0) return res.status(400).json({ success: false, error: 'criticalWait must be > 0' });
        updates.criticalWait = val;
      }
      if (longWait !== undefined) {
        const val = parseInt(longWait, 10);
        if (isNaN(val) || val <= 0) return res.status(400).json({ success: false, error: 'longWait must be > 0' });
        updates.longWait = val;
      }
      if (vulnerableWait !== undefined) {
        const val = parseInt(vulnerableWait, 10);
        if (isNaN(val) || val <= 0) return res.status(400).json({ success: false, error: 'vulnerableWait must be > 0' });
        updates.vulnerableWait = val;
      }
      if (moderateWait !== undefined) {
        const val = parseInt(moderateWait, 10);
        if (isNaN(val) || val <= 0) return res.status(400).json({ success: false, error: 'moderateWait must be > 0' });
        updates.moderateWait = val;
      }

      const updated = await dbService.updateRuleConfig(updates, queueId, req.user, organizationId);
      const queueRules = await dbService.getQueueRules(queueId, organizationId);

      res.json({
        success: true,
        message: `Thresholds updated successfully (Ruleset ${queueRules.version}). Next queue analysis will evaluate these values.`,
        version: queueRules.version,
        thresholds: updated,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
};
