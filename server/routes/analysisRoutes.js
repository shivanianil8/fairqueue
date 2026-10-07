import { Router } from 'express';
import { analysisController } from '../controllers/analysisController.js';
import { authenticate, requireOrganization } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticate, requireOrganization, analysisController.getAllAnalyses);
router.get('/:id', authenticate, requireOrganization, analysisController.getAnalysisById);

export default router;
