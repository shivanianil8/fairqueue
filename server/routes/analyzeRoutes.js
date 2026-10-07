import { Router } from 'express';
import { analyzeController } from '../controllers/analyzeController.js';
import { authenticate, requireOrganization } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', authenticate, requireOrganization, analyzeController.analyzeQueue);
router.post('/compare', authenticate, requireOrganization, analyzeController.comparePair);

export default router;
