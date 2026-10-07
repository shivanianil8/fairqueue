import express from 'express';
import { auditController } from '../controllers/auditController.js';
import { authenticate, requireOrganization } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticate, requireOrganization, auditController.getAuditLogs);
router.get('/export', authenticate, requireOrganization, auditController.exportAuditLogs);

export default router;
