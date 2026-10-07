import { dbService } from '../services/dbService.js';
import { prologService } from '../services/prologService.js';

export const analyzeController = {
  // ---------------------------------------------------------------------------
  // 1. EXECUTE PROLOG REASONING (ORGANIZATION SCOPED)
  // ---------------------------------------------------------------------------
  async analyzeQueue(req, res) {
    try {
      const organizationId = req.organizationId;
      if (!organizationId) {
        return res.status(403).json({ success: false, error: 'No active organization found.', code: 'NO_ORGANIZATION' });
      }

      const queueId = req.query.queueId || req.body?.queueId;
      const people = await dbService.getQueueEntries(queueId, organizationId);

      if (!people || people.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Queue is currently empty. Please register visitors or load sample data to analyze.',
        });
      }

      // Fetch dynamic thresholds for this organization's queue
      const ruleConfig = await dbService.getRuleConfig(queueId || 'default', organizationId);
      const thresholds = {
        criticalWait: ruleConfig.criticalWait,
        longWait: ruleConfig.longWait,
        vulnerableWait: ruleConfig.vulnerableWait,
        moderateWait: ruleConfig.moderateWait,
      };

      // Execute pure First-Order Logic reasoning in Prolog
      const startTime = Date.now();
      const { rankedQueue, engineUsed, factsCode } = await prologService.analyzeQueue(people, thresholds);
      const executionTimeMs = Date.now() - startTime;

      // Update deduced priorities and recommended ranks in storage
      for (let i = 0; i < rankedQueue.length; i++) {
        const item = rankedQueue[i];
        await dbService.updatePersonPriority(
          item.personId,
          item.priority,
          item.explanation,
          item.ruleCodes || [],
          i + 1,
          organizationId
        );
      }

      // Compute statistics
      let highCount = 0;
      let mediumCount = 0;
      let normalCount = 0;
      let totalWait = 0;

      for (const p of rankedQueue) {
        if (p.priority === 'high') highCount++;
        else if (p.priority === 'medium') mediumCount++;
        else normalCount++;
        totalWait += p.waitingTime;
      }

      const avgWait = rankedQueue.length > 0 ? Math.round((totalWait / rankedQueue.length) * 10) / 10 : 0;

      // Save historical snapshot
      const analysisId = `anl-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const savedAnalysis = await dbService.saveAnalysis({
        analysisId,
        organizationId,
        queueId: queueId || 'all',
        timestamp: new Date(),
        totalPeople: rankedQueue.length,
        highPriorityCount: highCount,
        mediumPriorityCount: mediumCount,
        normalPriorityCount: normalCount,
        averageWaitTime: avgWait,
        engineUsed,
        thresholds,
        rankedQueue,
        prologFactsUsed: factsCode,
        rawQuery: 'rank_all_people(RankedList).',
      });

      res.json({
        success: true,
        message: 'Queue analyzed and fairly prioritized using pure Prolog Horn clauses.',
        analysisId,
        timestamp: savedAnalysis.timestamp,
        executionTimeMs,
        engineUsed,
        stats: {
          totalPeople: rankedQueue.length,
          highPriorityCount: highCount,
          mediumPriorityCount: mediumCount,
          normalPriorityCount: normalCount,
          averageWaitTime: avgWait,
        },
        summary: {
          totalAnalyzed: rankedQueue.length,
          highPriorityCount: highCount,
          mediumPriorityCount: mediumCount,
          normalPriorityCount: normalCount,
          averageWaitTime: avgWait,
        },
        thresholds,
        rankedQueue,
        prologFactsUsed: factsCode,
      });
    } catch (err) {
      console.error('Analysis error:', err);
      res.status(500).json({
        success: false,
        error: `Prolog reasoning failure: ${err.message}`,
      });
    }
  },

  // ---------------------------------------------------------------------------
  // 2. PAIRWISE COMPARISON (EXPLAIN "WHY PERSON A BEFORE PERSON B?")
  // ---------------------------------------------------------------------------
  async comparePair(req, res) {
    try {
      const organizationId = req.organizationId;
      const { personIdA, personIdB } = req.body;

      if (!personIdA || !personIdB) {
        return res.status(400).json({ success: false, error: 'Both personIdA and personIdB are required.' });
      }

      const personA = await dbService.getQueueEntryById(personIdA, organizationId);
      const personB = await dbService.getQueueEntryById(personIdB, organizationId);

      if (!personA || !personB) {
        return res.status(404).json({ success: false, error: 'One or both specified persons were not found in this organization.' });
      }

      const ruleConfig = await dbService.getRuleConfig(personA.queueId, organizationId);
      const thresholds = {
        criticalWait: ruleConfig.criticalWait,
        longWait: ruleConfig.longWait,
        vulnerableWait: ruleConfig.vulnerableWait,
        moderateWait: ruleConfig.moderateWait,
      };

      const result = await prologService.comparePair(personA, personB, thresholds);

      res.json({
        success: true,
        data: {
          personA,
          personB,
          winnerId: result.winnerId,
          loserId: result.loserId,
          reason: result.reason,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
};
