import express from 'express';
import { authController } from '../controllers/authController.js';
import { authenticate, requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Authentication Endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected Session Endpoints
router.get('/me', authenticate, requireAuth, authController.getCurrentUser);
router.put('/profile', authenticate, requireAuth, authController.updateProfile);

export default router;
