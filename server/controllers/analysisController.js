import { dbService } from '../services/dbService.js';

export const analysisController = {
  async getAllAnalyses(req, res) {
    try {
      const organizationId = req.organizationId;
      const { queueId } = req.query;
      const analyses = await dbService.getAnalyses(queueId, organizationId);
      res.json({ success: true, count: analyses.length, data: analyses });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getAnalysisById(req, res) {
    try {
      const { id } = req.params;
      const organizationId = req.organizationId;
      const analysis = await dbService.getAnalysisById(id, organizationId);
      if (!analysis) {
        return res.status(404).json({ success: false, error: `Analysis with ID '${id}' not found.` });
      }
      res.json({ success: true, data: analysis });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
};
