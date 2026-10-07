import express from 'express';
import { organizationController } from '../controllers/organizationController.js';
import { authenticate, requireAuth, requireOrganization, requireOrgRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Onboarding: Create Organization (authenticated user becomes ORGANIZATION_ADMIN)
router.post('/', authenticate, requireAuth, organizationController.createOrganization);

// Current Organization profile
router.get('/current', authenticate, requireOrganization, organizationController.getOrganization);
router.patch('/current', authenticate, requireOrgRole(['ORGANIZATION_ADMIN']), organizationController.updateOrganization);

// Team & Membership management
router.get('/current/members', authenticate, requireOrganization, organizationController.getTeamMembers);
router.post('/current/invitations', authenticate, requireOrgRole(['ORGANIZATION_ADMIN']), organizationController.inviteMember);
router.patch('/current/members/:userId/role', authenticate, requireOrgRole(['ORGANIZATION_ADMIN']), organizationController.updateMemberRole);
router.delete('/current/members/:userId', authenticate, requireOrgRole(['ORGANIZATION_ADMIN']), organizationController.removeMember);

export default router;
