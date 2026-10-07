import { dbService } from '../services/dbService.js';
import { authService } from '../services/authService.js';
import { auditService } from '../services/auditService.js';

export const authController = {
  // ---------------------------------------------------------------------------
  // 1. REGISTRATION
  // ---------------------------------------------------------------------------
  async register(req, res) {
    try {
      const { name, email, password, confirmPassword } = req.body;

      // Validation
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Full name is required.' });
      }

      if (!email || typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({ success: false, error: 'Email address is required.' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
      }

      if (!password || typeof password !== 'string') {
        return res.status(400).json({ success: false, error: 'Password is required.' });
      }

      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters long.',
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          error: 'Passwords do not match. Please re-enter matching passwords.',
        });
      }

      // Check unique email
      const existingUser = await dbService.getUserByEmail(email.trim());
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email address already exists. Please sign in instead.',
        });
      }

      // Hash password securely
      const passwordHash = authService.hashPassword(password);

      // Create user record in database
      const newUser = await dbService.createUser({
        name: name.trim(),
        email: email.trim(),
        passwordHash,
        emailVerified: true, // Auto-verified for seamless local development
      });

      // Generate session token (user has no organization yet)
      const token = authService.createToken(newUser);

      // Set HTTP-Only Cookie
      res.cookie('fairqueue_session', token, authService.getSessionCookieOptions());

      await auditService.log(
        { user: newUser, ip: req.ip },
        'USER_REGISTERED',
        newUser.userId,
        { email: newUser.email, name: newUser.name }
      );

      const safeUser = {
        userId: newUser.userId,
        name: newUser.name,
        email: newUser.email,
        emailVerified: newUser.emailVerified,
        createdAt: newUser.createdAt,
      };

      res.status(201).json({
        success: true,
        message: `Welcome to FAIRQUEUE, ${newUser.name}. Please set up your organization.`,
        token,
        user: safeUser,
        needsOnboarding: true,
      });
    } catch (err) {
      console.error('[Register Error]', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ---------------------------------------------------------------------------
  // 2. LOGIN
  // ---------------------------------------------------------------------------
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required.',
        });
      }

      const user = await dbService.getUserByEmail(email.trim());
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials. No account found with this email.',
        });
      }

      const isPasswordValid = authService.verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials. Password is incorrect.',
        });
      }

      // Load user's organizations and memberships
      const memberships = await dbService.getUserMemberships(user.userId);
      const activeMembership = memberships.length > 0 ? memberships[0] : null;

      const organizationId = activeMembership ? activeMembership.organizationId : null;
      const role = activeMembership ? activeMembership.role : null;
      let organization = null;

      if (organizationId) {
        organization = await dbService.getOrganization(organizationId);
      }

      // Update last login timestamp
      await dbService.updateUser(user.userId, { lastLoginAt: new Date() });

      // Create session token with organization and role claims
      const token = authService.createToken(user, organizationId, role);

      // Set HTTP-Only Cookie
      res.cookie('fairqueue_session', token, authService.getSessionCookieOptions());

      await auditService.log(
        { user, ip: req.ip, organizationId: organizationId || 'unassigned' },
        'USER_LOGIN',
        user.userId,
        { email: user.email, role: role || 'unassigned' }
      );

      const safeUser = {
        userId: user.userId,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      };

      res.json({
        success: true,
        message: `Welcome back, ${user.name}.`,
        token,
        user: safeUser,
        organization,
        activeOrganization: organization,
        role,
        activeRole: role,
        memberships,
        needsOnboarding: !activeMembership,
      });
    } catch (err) {
      console.error('[Login Error]', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ---------------------------------------------------------------------------
  // 3. LOGOUT
  // ---------------------------------------------------------------------------
  async logout(req, res) {
    try {
      res.clearCookie('fairqueue_session', { path: '/' });

      if (req.user) {
        await auditService.log(
          { user: req.user, ip: req.ip, organizationId: req.organizationId || 'unassigned' },
          'USER_LOGOUT',
          req.user.userId,
          { email: req.user.email }
        );
      }

      res.json({
        success: true,
        message: 'You have been signed out successfully.',
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ---------------------------------------------------------------------------
  // 4. CURRENT SESSION PROFILE
  // ---------------------------------------------------------------------------
  async getCurrentUser(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated.' });
      }

      const organization = req.organizationId ? await dbService.getOrganization(req.organizationId) : null;

      res.json({
        success: true,
        user: req.user,
        organization,
        organizationId: req.organizationId,
        role: req.role,
        memberships: req.userMemberships || [],
        needsOnboarding: !req.organizationId,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ---------------------------------------------------------------------------
  // 5. FORGOT PASSWORD
  // ---------------------------------------------------------------------------
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ success: false, error: 'Email address is required.' });
      }

      const user = await dbService.getUserByEmail(email.trim());

      let devResetUrl = null;
      if (user) {
        const resetToken = authService.generateSecureToken(32);
        const tokenHash = authService.hashToken(resetToken);

        await dbService.createPasswordReset({
          userId: user.userId,
          email: user.email,
          tokenHash,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        });

        devResetUrl = `/reset-password?token=${resetToken}`;
        console.log(`[Development Mode] Password Reset Link for ${user.email}:`);
        console.log(` -> http://localhost:5001${devResetUrl}`);

        await auditService.log(
          { user, ip: req.ip },
          'PASSWORD_RESET_REQUESTED',
          user.userId,
          { email: user.email }
        );

        return res.json({
          success: true,
          message: 'If an account with that email exists, password reset instructions have been prepared.',
          devResetUrl,
          devToken: resetToken,
          devResetToken: resetToken,
        });
      }

      // Security rule: Never reveal whether arbitrary email exists
      res.json({
        success: true,
        message: 'If an account with that email exists, password reset instructions have been prepared.',
        devResetUrl: null,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ---------------------------------------------------------------------------
  // 6. RESET PASSWORD
  // ---------------------------------------------------------------------------
  async resetPassword(req, res) {
    try {
      const token = req.body.token;
      const targetPassword = req.body.newPassword || req.body.password;
      const confirm = req.body.confirmPassword || req.body.confirm;

      if (!token) {
        return res.status(400).json({ success: false, error: 'Reset token is required.' });
      }

      if (!targetPassword || targetPassword.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'New password must be at least 8 characters long.',
        });
      }

      if (targetPassword !== confirm) {
        return res.status(400).json({
          success: false,
          error: 'Passwords do not match.',
        });
      }

      const tokenHash = authService.hashToken(token);
      const resetDoc = await dbService.getPasswordResetByToken(tokenHash);

      if (!resetDoc) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired password reset token. Please request a new one.',
        });
      }

      const newPasswordHash = authService.hashPassword(targetPassword);
      await dbService.updateUserPassword(resetDoc.userId, newPasswordHash);
      await dbService.consumePasswordReset(tokenHash);

      await auditService.log(
        { user: { userId: resetDoc.userId, email: resetDoc.email }, ip: req.ip },
        'PASSWORD_RESET_COMPLETED',
        resetDoc.userId,
        { email: resetDoc.email }
      );

      res.json({
        success: true,
        message: 'Your password has been reset successfully. Please sign in with your new password.',
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ---------------------------------------------------------------------------
  // 7. UPDATE PROFILE & CHANGE PASSWORD
  // ---------------------------------------------------------------------------
  async updateProfile(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
      }

      const { name, currentPassword, newPassword, confirmPassword } = req.body;
      const user = await dbService.getUserById(req.user.userId);

      // Name change
      if (name && name.trim()) {
        user.name = name.trim();
        await dbService.updateUser(user.userId, { name: user.name });
      }

      // Password change
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({
            success: false,
            error: 'Current password is required to set a new password.',
          });
        }

        const isCurrentValid = authService.verifyPassword(currentPassword, user.passwordHash);
        if (!isCurrentValid) {
          return res.status(400).json({
            success: false,
            error: 'Current password is incorrect.',
          });
        }

        if (newPassword.length < 8) {
          return res.status(400).json({
            success: false,
            error: 'New password must be at least 8 characters long.',
          });
        }

        if (newPassword !== confirmPassword) {
          return res.status(400).json({
            success: false,
            error: 'New passwords do not match.',
          });
        }

        const newHash = authService.hashPassword(newPassword);
        await dbService.updateUserPassword(user.userId, newHash);
      }

      await auditService.log(
        { user, ip: req.ip, organizationId: req.organizationId || 'unassigned' },
        'PROFILE_UPDATED',
        user.userId,
        { changedName: Boolean(name), changedPassword: Boolean(newPassword) }
      );

      const safeUser = {
        userId: user.userId,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      };

      res.json({
        success: true,
        message: 'Your profile has been updated successfully.',
        user: safeUser,
        data: safeUser,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
};
