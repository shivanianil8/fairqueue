import { dbService } from '../services/dbService.js';
import { authService } from '../services/authService.js';
import { auditService } from '../services/auditService.js';

export const organizationController = {
  // ---------------------------------------------------------------------------
  // 1. CREATE ORGANIZATION (BECOMES ORGANIZATION_ADMIN)
  // ---------------------------------------------------------------------------
  async createOrganization(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
      }

      const { name, type, description } = req.body;

      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Organization name is required.' });
      }

      const result = await dbService.createOrganizationWithAdmin({
        name: name.trim(),
        type: type || 'Healthcare',
        description: description || '',
        createdBy: req.user.userId,
      });

      // Issue refreshed session token with new organization and admin role
      const token = authService.createToken(req.user, result.organization.organizationId, 'ORGANIZATION_ADMIN');
      res.cookie('fairqueue_session', token, authService.getSessionCookieOptions());

      await auditService.log(
        { user: req.user, ip: req.ip, organizationId: result.organization.organizationId },
        'ORGANIZATION_CREATED',
        result.organization.organizationId,
        { name: result.organization.name, type: result.organization.type }
      );

      res.status(201).json({
        success: true,
        message: `Organization '${result.organization.name}' created successfully. You are now the Organization Admin.`,
        token,
        organization: result.organization,
        data: result.organization,
        role: 'ORGANIZATION_ADMIN',
      });
    } catch (err) {
      console.error('[Create Org Error]', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ---------------------------------------------------------------------------
  // 2. GET CURRENT ORGANIZATION
  // ---------------------------------------------------------------------------
  async getOrganization(req, res) {
    try {
      if (!req.organizationId) {
        return res.status(404).json({ success: false, error: 'No active organization found.' });
      }

      const org = await dbService.getOrganization(req.organizationId);
      if (!org) {
        return res.status(404).json({ success: false, error: 'Organization not found.' });
      }

      res.json({
        success: true,
        data: org,
        role: req.role,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ---------------------------------------------------------------------------
  // 3. UPDATE ORGANIZATION SETTINGS (ADMIN ONLY)
  // ---------------------------------------------------------------------------
  async updateOrganization(req, res) {
    try {
      const updates = req.body;
      const org = await dbService.updateOrganization(req.organizationId, updates);

      await auditService.log(
        { user: req.user, ip: req.ip, organizationId: req.organizationId },
        'ORGANIZATION_UPDATED',
        req.organizationId,
        updates
      );

      res.json({
        success: true,
        message: 'Organization settings updated successfully.',
        data: org,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ---------------------------------------------------------------------------
  // 4. GET TEAM MEMBERS
  // ---------------------------------------------------------------------------
  async getTeamMembers(req, res) {
    try {
      const members = await dbService.getOrganizationMembers(req.organizationId);
      res.json({
        success: true,
        count: members.length,
        data: members,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ---------------------------------------------------------------------------
  // 5. INVITE TEAM MEMBER
  // ---------------------------------------------------------------------------
  async inviteMember(req, res) {
    try {
      const { email, role } = req.body;

      if (!email || typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({ success: false, error: 'Email address is required.' });
      }

      const validRoles = ['ORGANIZATION_ADMIN', 'QUEUE_MANAGER', 'OPERATOR', 'VIEWER'];
      if (!role || !validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: `Role must be one of: ${validRoles.join(', ')}`,
        });
      }

      // Check if user is already a member
      const existingUser = await dbService.getUserByEmail(email.trim());
      if (existingUser) {
        const existingMembership = await dbService.getMembership(existingUser.userId, req.organizationId);
        if (existingMembership) {
          return res.status(409).json({
            success: false,
            error: `'${email}' is already a member of this organization.`,
          });
        }
      }

      const inviteToken = authService.generateSecureToken(24);
      const tokenHash = authService.hashToken(inviteToken);

      const invitation = await dbService.createInvitation({
        organizationId: req.organizationId,
        email: email.trim(),
        role,
        tokenHash,
        invitedBy: req.user.userId,
      });

      const devInviteUrl = `/register?inviteToken=${inviteToken}&email=${encodeURIComponent(email.trim())}`;
      console.log(`[Development Mode] Team Invitation Link for ${email}:`);
      console.log(` -> http://localhost:5001${devInviteUrl}`);

      await auditService.log(
        { user: req.user, ip: req.ip, organizationId: req.organizationId },
        'TEAM_MEMBER_INVITED',
        invitation.invitationId,
        { email: invitation.email, role: invitation.role }
      );

      res.status(201).json({
        success: true,
        message: `Invitation generated for ${email} as ${role}.`,
        invitation,
        devInviteUrl, // For friction-free evaluation without requiring a paid SMTP server
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ---------------------------------------------------------------------------
  // 6. UPDATE MEMBER ROLE
  // ---------------------------------------------------------------------------
  async updateMemberRole(req, res) {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (userId === req.user.userId && role !== 'ORGANIZATION_ADMIN') {
        return res.status(400).json({
          success: false,
          error: 'You cannot demote yourself from Organization Admin.',
        });
      }

      const updated = await dbService.updateMemberRole(req.organizationId, userId, role);

      await auditService.log(
        { user: req.user, ip: req.ip, organizationId: req.organizationId },
        'MEMBER_ROLE_UPDATED',
        userId,
        { newRole: role }
      );

      res.json({
        success: true,
        message: `Member role updated to ${role}.`,
        data: updated,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ---------------------------------------------------------------------------
  // 7. REMOVE MEMBER
  // ---------------------------------------------------------------------------
  async removeMember(req, res) {
    try {
      const { userId } = req.params;

      if (userId === req.user.userId) {
        return res.status(400).json({
          success: false,
          error: 'You cannot remove yourself from your organization.',
        });
      }

      await dbService.removeMember(req.organizationId, userId);

      await auditService.log(
        { user: req.user, ip: req.ip, organizationId: req.organizationId },
        'MEMBER_REMOVED',
        userId
      );

      res.json({
        success: true,
        message: 'Member removed from organization.',
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
};
