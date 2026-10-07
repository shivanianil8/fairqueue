import express from 'express';
import { queueController } from '../controllers/queueController.js';
import { authenticate, requireOrganization, requireOrgRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticate, requireOrganization, queueController.getAllQueues);
router.get('/:queueId', authenticate, requireOrganization, queueController.getQueueById);
router.post('/', authenticate, requireOrgRole(['ORGANIZATION_ADMIN', 'QUEUE_MANAGER']), queueController.createQueue);
router.patch('/:queueId', authenticate, requireOrgRole(['ORGANIZATION_ADMIN', 'QUEUE_MANAGER']), queueController.updateQueue);
router.delete('/:queueId', authenticate, requireOrgRole(['ORGANIZATION_ADMIN']), queueController.deleteQueue);

export default router;
