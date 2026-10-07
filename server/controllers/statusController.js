import { getDBStatus } from '../config/db.js';
import { prologService } from '../services/prologService.js';
import { dbService } from '../services/dbService.js';

export const statusController = {
  async getSystemStatus(req, res) {
    try {
      const dbStatus = getDBStatus();
      const prologStatus = prologService.getEngineStatus();
      const queues = await dbService.getQueues().catch(() => []);
      const entries = await dbService.getQueueEntries().catch(() => []);
      const analyses = await dbService.getAnalyses().catch(() => []);

      res.json({
        success: true,
        system: {
          name: 'FAIRQUEUE Multi-Tenant Reasoning Platform',
          version: '2.0.0-saas',
          uptime: Math.round(process.uptime()),
          nodeVersion: process.version,
          platform: process.platform,
        },
        database: dbStatus,
        prologEngine: prologStatus,
        queue: {
          totalQueues: queues.length,
          totalPeople: entries.length,
          lastAnalysisCount: analyses.length,
          latestAnalysisTime: analyses.length > 0 ? analyses[0].timestamp : null,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
};
