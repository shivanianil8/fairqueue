import { dbService } from '../services/dbService.js';

export const reportController = {
  // ---------------------------------------------------------------------------
  // 1. GENERATE OPERATIONAL REPORT (ORGANIZATION ISOLATED)
  // ---------------------------------------------------------------------------
  async getOperationalReport(req, res) {
    try {
      const organizationId = req.organizationId;
      if (!organizationId) {
        return res.status(403).json({ success: false, error: 'No active organization found.', code: 'NO_ORGANIZATION' });
      }

      const { queueId, timeRange } = req.query;
      const report = await dbService.generateOperationalReport(queueId, organizationId, timeRange || 'today');

      res.json({
        success: true,
        data: report,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
};
