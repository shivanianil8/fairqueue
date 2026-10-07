import { dbService } from '../services/dbService.js';
import { auditService } from '../services/auditService.js';
import { demoPeople } from '../data/demoData.js';

export const queueEntryController = {
  // ---------------------------------------------------------------------------
  // 1. GET ENTRIES FOR A QUEUE (ORGANIZATION SCOPED)
  // ---------------------------------------------------------------------------
  async getEntries(req, res) {
    try {
      const { queueId } = req.params;
      const { status } = req.query;
      const organizationId = req.organizationId;

      const queue = await dbService.getQueueById(queueId, organizationId);
      if (!queue) {
        return res.status(404).json({
          success: false,
          error: `Queue '${queueId}' not found in your organization.`,
        });
      }

      let statusFilter = null;
      if (status && status !== 'all') {
        statusFilter = status.includes(',') ? status.split(',') : status;
      }

      const entries = await dbService.getQueueEntries(queueId, organizationId, statusFilter);
      res.json({
        success: true,
        queueId,
        count: entries.length,
        data: entries,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ---------------------------------------------------------------------------
  // 2. REGISTER VISITOR TICKET (WAITING)
  // ---------------------------------------------------------------------------
  async createEntry(req, res) {
    try {
      const { queueId } = req.params;
      const organizationId = req.organizationId;
      const { personId, name, waitingTime, urgency, appointmentStatus, specialRequirement, arrivalTime } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Visitor name is required.' });
      }

      const wait = parseInt(waitingTime, 10);
      if (isNaN(wait) || wait < 0) {
        return res.status(400).json({ success: false, error: 'Waiting time must be a non-negative number of minutes.' });
      }

      const newEntry = await dbService.createQueueEntry({
        organizationId,
        queueId,
        personId: personId && personId.trim() ? personId.trim() : undefined,
        name: name.trim(),
        waitingTime: wait,
        urgency: urgency || 'low',
        appointmentStatus: appointmentStatus || 'walkin',
        specialRequirement: specialRequirement || 'none',
        arrivalTime: arrivalTime && arrivalTime.trim() ? arrivalTime.trim() : '09:00',
      });

      await auditService.log(
        { user: req.user, ip: req.ip, organizationId },
        'ENTRY_REGISTERED',
        newEntry.entryId,
        {
          personId: newEntry.personId,
          name: newEntry.name,
          urgency: newEntry.urgency,
          appointmentStatus: newEntry.appointmentStatus,
        }
      );

      res.status(201).json({
        success: true,
        message: `Registered '${newEntry.name}' (Ticket: ${newEntry.personId}) to queue.`,
        data: newEntry,
      });
    } catch (err) {
      if (err.message && err.message.includes('already active')) {
        return res.status(409).json({ success: false, error: err.message });
      }
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ---------------------------------------------------------------------------
  // 3. WORKFLOW STATUS TRANSITION (WAITING -> CALLED -> IN_SERVICE -> COMPLETED)
  // ---------------------------------------------------------------------------
  async updateStatus(req, res) {
    try {
      const { queueId, entryId } = req.params;
      const organizationId = req.organizationId;
      const { status } = req.body;

      const validStatuses = ['WAITING', 'CALLED', 'IN_SERVICE', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
      }

      const result = await dbService.updateQueueEntryStatus(entryId, status, req.user, organizationId);

      await auditService.log(
        { user: req.user, ip: req.ip, organizationId },
        'QUEUE_STATUS_CHANGED',
        entryId,
        {
          previousStatus: result.prevStatus,
          newStatus: status,
          personId: result.entry.personId,
          servedBy: result.entry.servedBy,
        }
      );

      res.json({
        success: true,
        message: `Status updated to ${status} for ticket ${result.entry.personId}.`,
        data: result.entry,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ---------------------------------------------------------------------------
  // 4. CALL NEXT PERSON (OPERATOR ACTION VS PROLOG RECOMMENDATION)
  // ---------------------------------------------------------------------------
  async callNext(req, res) {
    try {
      const { queueId } = req.params;
      const organizationId = req.organizationId;

      // Fetch active WAITING entries for this organization's queue
      const waitingEntries = await dbService.getQueueEntries(queueId, organizationId, 'WAITING');
      if (waitingEntries.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No waiting visitors in this queue.',
        });
      }

      // Pick top ranked entry (rank 1), or fallback to first
      const ranked = waitingEntries
        .filter(e => typeof e.recommendedRank === 'number')
        .sort((a, b) => a.recommendedRank - b.recommendedRank);

      const targetEntry = ranked.length > 0 ? ranked[0] : waitingEntries[0];

      const result = await dbService.updateQueueEntryStatus(targetEntry.entryId, 'CALLED', req.user, organizationId);

      await auditService.log(
        { user: req.user, ip: req.ip, organizationId },
        'ENTRY_CALLED',
        targetEntry.entryId,
        {
          personId: targetEntry.personId,
          name: targetEntry.name,
          rank: targetEntry.recommendedRank || 1,
          priority: targetEntry.priority,
          calledBy: req.user ? { name: req.user.name, role: req.role } : 'Operator',
        }
      );

      res.json({
        success: true,
        message: `Called Ticket ${targetEntry.personId} (${targetEntry.name}) to service desk.`,
        data: result.entry,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ---------------------------------------------------------------------------
  // 5. CONTROLLED MANUAL OVERRIDE (WITH MANDATORY AUDIT JUSTIFICATION)
  // ---------------------------------------------------------------------------
  async manualOverride(req, res) {
    try {
      const { queueId, entryId } = req.params;
      const organizationId = req.organizationId;
      const { newPriority, overrideReason } = req.body;

      const validPriorities = ['critical', 'high', 'medium', 'normal', 'low'];
      if (!newPriority || !validPriorities.includes(newPriority.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: `Priority must be one of: ${validPriorities.join(', ')}`,
        });
      }

      if (!overrideReason || typeof overrideReason !== 'string' || !overrideReason.trim()) {
        return res.status(400).json({
          success: false,
          error: 'A mandatory justification reason is required for manual overrides.',
        });
      }

      const entry = await dbService.overrideQueueEntry(
        entryId,
        newPriority.toLowerCase(),
        overrideReason,
        req.user,
        organizationId
      );

      await auditService.log(
        { user: req.user, ip: req.ip, organizationId },
        'MANUAL_OVERRIDE_RECORDED',
        entry.entryId,
        {
          personId: entry.personId,
          name: entry.name,
          assignedPriority: newPriority.toLowerCase(),
          previousPriority: entry.overrideDetails.previousPriority,
          reason: overrideReason.trim(),
          authorizedBy: req.user?.email,
        }
      );

      res.json({
        success: true,
        message: `Manual override recorded for ${entry.personId}. Priority set to ${newPriority}.`,
        data: entry,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ---------------------------------------------------------------------------
  // 6. DELETE ENTRY
  // ---------------------------------------------------------------------------
  async deleteEntry(req, res) {
    try {
      const { queueId, entryId } = req.params;
      const organizationId = req.organizationId;

      const deleted = await dbService.deleteQueueEntry(entryId, organizationId);
      if (!deleted) {
        return res.status(404).json({ success: false, error: `Queue entry '${entryId}' not found.` });
      }

      await auditService.log(
        { user: req.user, ip: req.ip, organizationId },
        'ENTRY_DELETED',
        entryId,
        { personId: deleted.personId, name: deleted.name }
      );

      res.json({ success: true, message: `Visitor ${deleted.personId} removed.` });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ---------------------------------------------------------------------------
  // 7. OPTIONAL EXPLICIT SAMPLE DATA SEEDING (SEPARATE FROM REAL WORKFLOW)
  // ---------------------------------------------------------------------------
  async seedSampleData(req, res) {
    try {
      const { queueId } = req.params;
      const organizationId = req.organizationId;

      const sampleBatch = demoPeople.slice(0, 6);
      const created = [];

      for (const p of sampleBatch) {
        try {
          const entry = await dbService.createQueueEntry({
            organizationId,
            queueId,
            name: p.name,
            waitingTime: p.waitingTime,
            urgency: p.urgency,
            appointmentStatus: p.appointmentStatus,
            specialRequirement: p.specialRequirement,
            arrivalTime: p.arrivalTime,
          });
          created.push(entry);
        } catch (e) {
          // ignore duplicates during re-seed
        }
      }

      await auditService.log(
        { user: req.user, ip: req.ip, organizationId },
        'SAMPLE_DATA_LOADED',
        queueId,
        { count: created.length }
      );

      res.json({
        success: true,
        message: `Loaded ${created.length} sample visitor records for testing rules.`,
        data: created,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
};
