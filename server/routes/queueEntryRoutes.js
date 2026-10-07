import express from 'express';
import { queueEntryController } from '../controllers/queueEntryController.js';
import { authenticate, requireOrganization, requireOrgRole } from '../middleware/authMiddleware.js';

// MergeParams to access :queueId from parent router
const router = express.Router({ mergeParams: true });

router.get('/', authenticate, requireOrganization, queueEntryController.getEntries);
router.post('/', authenticate, requireOrgRole(['ORGANIZATION_ADMIN', 'QUEUE_MANAGER', 'OPERATOR']), queueEntryController.createEntry);
router.post('/call-next', authenticate, requireOrgRole(['ORGANIZATION_ADMIN', 'QUEUE_MANAGER', 'OPERATOR']), queueEntryController.callNext);
router.patch('/:entryId/status', authenticate, requireOrgRole(['ORGANIZATION_ADMIN', 'QUEUE_MANAGER', 'OPERATOR']), queueEntryController.updateStatus);
router.post('/:entryId/override', authenticate, requireOrgRole(['ORGANIZATION_ADMIN', 'QUEUE_MANAGER']), queueEntryController.manualOverride);
router.delete('/:entryId', authenticate, requireOrgRole(['ORGANIZATION_ADMIN', 'QUEUE_MANAGER']), queueEntryController.deleteEntry);
router.post('/seed-sample', authenticate, requireOrgRole(['ORGANIZATION_ADMIN', 'QUEUE_MANAGER']), queueEntryController.seedSampleData);

export default router;
