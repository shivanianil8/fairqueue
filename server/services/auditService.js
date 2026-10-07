import { dbService } from './dbService.js';

export const auditService = {
  async log(req, eventType, affectedRecordId, details = {}, customContext = {}) {
    const user = req?.user || customContext.user || {
      userId: 'SYSTEM',
      email: 'system@fairqueue.local',
      role: 'SYSTEM',
      name: 'System Engine',
    };

    const organizationId = req?.organizationId || customContext.organizationId || req?.user?.organizationId || 'org-citycare';
    const queueId = req?.params?.queueId || req?.body?.queueId || req?.queueId || customContext.queueId || 'all';

    const logEntry = {
      logId: `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date(),
      organizationId,
      queueId,
      userId: user.userId,
      userEmail: user.email,
      userRole: user.role,
      eventType,
      affectedRecordId: affectedRecordId || null,
      details: typeof details === 'string' ? { message: details } : details,
      ipAddress: req?.ip || req?.socket?.remoteAddress || '127.0.0.1',
    };

    try {
      await dbService.recordAuditLog(logEntry);
      console.log(`[Audit] ${logEntry.eventType} by ${logEntry.userEmail} on ${logEntry.affectedRecordId || 'N/A'}`);
    } catch (err) {
      console.error('[Audit Error] Failed to write audit log:', err.message);
    }

    return logEntry;
  },
};
