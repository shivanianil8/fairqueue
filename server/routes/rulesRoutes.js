import { Router } from 'express';
import { rulesController } from '../controllers/rulesController.js';
import { authenticate, requireOrganization, requireOrgRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticate, requireOrganization, rulesController.getRules);
router.put('/thresholds', authenticate, requireOrgRole(['ORGANIZATION_ADMIN', 'QUEUE_MANAGER']), rulesController.updateThresholds);

export default router;
