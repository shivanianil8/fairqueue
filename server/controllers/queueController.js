import { dbService } from '../services/dbService.js';
import { auditService } from '../services/auditService.js';

export const queueController = {
  // ---------------------------------------------------------------------------
  // 1. GET ALL QUEUES FOR CURRENT ORGANIZATION
  // ---------------------------------------------------------------------------
  async getAllQueues(req, res) {
    try {
      const organizationId = req.organizationId;
      if (!organizationId) {
        return res.status(403).json({ success: false, error: 'No active organization found.', code: 'NO_ORGANIZATION' });
      }

      const queues = await dbService.getQueues(organizationId);

      // Enhance with live counts for each queue
      const enhancedQueues = await Promise.all(
        queues.map(async (q) => {
          const entries = await dbService.getQueueEntries(q.queueId, organizationId);
          const rules = await dbService.getQueueRules(q.queueId, organizationId);
          return {
            ...q,
            activeRuleVersion: rules?.version || 'v1.0',
            counts: {
              total: entries.length,
              waiting: entries.filter((e) => e.status === 'WAITING').length,
              inService: entries.filter((e) => ['CALLED', 'IN_SERVICE'].includes(e.status)).length,
              completed: entries.filter((e) => e.status === 'COMPLETED').length,
            },
          };
        })
      );

      res.json({ success: true, count: enhancedQueues.length, data: enhancedQueues });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ---------------------------------------------------------------------------
  // 2. GET SPECIFIC QUEUE (ORGANIZATION ISOLATED)
  // ---------------------------------------------------------------------------
  async getQueueById(req, res) {
    try {
      const { queueId } = req.params;
      const organizationId = req.organizationId;

      const queue = await dbService.getQueueById(queueId, organizationId);
      if (!queue) {
        return res.status(404).json({ success: false, error: `Queue '${queueId}' not found in this organization.` });
      }

      const rules = await dbService.getQueueRules(queueId, organizationId);
      const entries = await dbService.getQueueEntries(queueId, organizationId);

      res.json({
        success: true,
        data: {
          ...queue,
          rules,
          counts: {
            total: entries.length,
            waiting: entries.filter((e) => e.status === 'WAITING').length,
            inService: entries.filter((e) => ['CALLED', 'IN_SERVICE'].includes(e.status)).length,
            completed: entries.filter((e) => e.status === 'COMPLETED').length,
          },
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ---------------------------------------------------------------------------
  // 3. CREATE NEW QUEUE (FIRST QUEUE SETUP OR EXPANSION)
  // ---------------------------------------------------------------------------
  async createQueue(req, res) {
    try {
      const { queueId, name, description, prefix, type, targetServiceMinutes } = req.body;
      const organizationId = req.organizationId;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Queue name is required.' });
      }

      const generatedId = queueId && queueId.trim()
        ? queueId.trim().toLowerCase().replace(/\s+/g, '-')
        : `q-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      const existing = await dbService.getQueueById(generatedId, organizationId);
      if (existing) {
        return res.status(409).json({ success: false, error: `A queue with ID '${generatedId}' already exists.` });
      }

      const newQueue = await dbService.createQueue({
        queueId: generatedId,
        organizationId,
        name: name.trim(),
        description: (description || '').trim(),
        prefix: prefix ? prefix.toUpperCase().trim() : 'Q',
        type: type || 'General',
        targetServiceMinutes: parseInt(targetServiceMinutes, 10) || 15,
      });

      // Initialize default ruleset for this queue
      await dbService.getQueueRules(newQueue.queueId, organizationId);

      await auditService.log(
        { user: req.user, ip: req.ip, organizationId },
        'QUEUE_CREATED',
        newQueue.queueId,
        { name: newQueue.name, prefix: newQueue.prefix }
      );

      res.status(201).json({
        success: true,
        message: `Queue '${newQueue.name}' created successfully.`,
        data: newQueue,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ---------------------------------------------------------------------------
  // 4. UPDATE QUEUE
  // ---------------------------------------------------------------------------
  async updateQueue(req, res) {
    try {
      const { queueId } = req.params;
      const organizationId = req.organizationId;
      const updates = req.body;

      const updated = await dbService.updateQueue(queueId, updates, organizationId);
      if (!updated) {
        return res.status(404).json({ success: false, error: `Queue '${queueId}' not found.` });
      }

      await auditService.log(
        { user: req.user, ip: req.ip, organizationId },
        'QUEUE_UPDATED',
        queueId,
        updates
      );

      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ---------------------------------------------------------------------------
  // 5. DELETE QUEUE
  // ---------------------------------------------------------------------------
  async deleteQueue(req, res) {
    try {
      const { queueId } = req.params;
      const organizationId = req.organizationId;

      const deleted = await dbService.deleteQueue(queueId, organizationId);
      if (!deleted) {
        return res.status(404).json({ success: false, error: `Queue '${queueId}' not found.` });
      }

      await auditService.log(
        { user: req.user, ip: req.ip, organizationId },
        'QUEUE_DELETED',
        queueId
      );

      res.json({ success: true, message: `Queue '${queueId}' deleted.` });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
};
