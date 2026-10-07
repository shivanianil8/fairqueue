import express from 'express';
import { reportController } from '../controllers/reportController.js';
import { authenticate, requireAuth, requireOrganization } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticate, requireAuth, requireOrganization, reportController.getOperationalReport);

export default router;
