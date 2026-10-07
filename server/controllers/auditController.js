import { dbService } from '../services/dbService.js';

export const auditController = {
  // ---------------------------------------------------------------------------
  // 1. QUERY AUDIT LOGS (ORGANIZATION ISOLATED)
  // ---------------------------------------------------------------------------
  async getAuditLogs(req, res) {
    try {
      const organizationId = req.organizationId;
      if (!organizationId) {
        return res.status(403).json({ success: false, error: 'No active organization found.', code: 'NO_ORGANIZATION' });
      }

      const { queueId, eventType, search } = req.query;

      const logs = await dbService.getAuditLogs({
        organizationId,
        queueId,
        eventType,
        search,
      });

      res.json({
        success: true,
        count: logs.length,
        data: logs,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ---------------------------------------------------------------------------
  // 2. EXPORT AUDIT TRAIL
  // ---------------------------------------------------------------------------
  async exportAuditLogs(req, res) {
    try {
      const organizationId = req.organizationId;
      if (!organizationId) {
        return res.status(403).json({ success: false, error: 'No active organization found.' });
      }

      const logs = await dbService.getAuditLogs({ organizationId });

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=fairqueue-audit-trail-${Date.now()}.json`);
      res.send(JSON.stringify(logs, null, 2));
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
};
