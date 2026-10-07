import { authService } from '../services/authService.js';
import { dbService } from '../services/dbService.js';

// Native cookie parser helper
function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader || typeof cookieHeader !== 'string') return cookies;
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.substring(0, idx).trim();
    const val = pair.substring(idx + 1).trim();
    try {
      cookies[key] = decodeURIComponent(val);
    } catch (e) {
      cookies[key] = val;
    }
  }
  return cookies;
}

export async function authenticate(req, res, next) {
  // 1. Try to extract from HTTP-Only cookie first, then Authorization Bearer header
  const cookies = parseCookies(req.headers.cookie);
  let token = cookies['fairqueue_session'];

  if (!token) {
    const authHeader = req.headers.authorization || req.headers['x-auth-token'];
    if (authHeader) {
      token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    }
  }

  if (!token) {
    req.user = null;
    req.organizationId = null;
    req.role = null;
    req.membership = null;
    return next();
  }

  const decoded = authService.verifyToken(token);
  if (!decoded || !decoded.userId) {
    req.user = null;
    req.organizationId = null;
    req.role = null;
    req.membership = null;
    return next();
  }

  // 2. Fetch fresh user record from database
  const user = await dbService.getUserById(decoded.userId);
  if (!user) {
    req.user = null;
    return next();
  }

  req.user = {
    userId: user.userId,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };

  // 3. Resolve active organization & role from database membership
  const memberships = await dbService.getUserMemberships(user.userId);
  req.userMemberships = memberships;

  // Determine active organization:
  // Prefer decoded.organizationId if valid, otherwise first active membership
  let activeOrgId = decoded.organizationId;
  let activeMembership = null;

  if (activeOrgId) {
    activeMembership = memberships.find(m => m.organizationId === activeOrgId);
  }

  if (!activeMembership && memberships.length > 0) {
    activeMembership = memberships[0];
    activeOrgId = activeMembership.organizationId;
  }

  if (activeMembership) {
    req.organizationId = activeMembership.organizationId;
    req.role = activeMembership.role;
    req.membership = activeMembership;
  } else {
    req.organizationId = null;
    req.role = null;
    req.membership = null;
  }

  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in to your account.',
      code: 'UNAUTHORIZED',
    });
  }
  next();
}

export function requireOrganization(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required.',
      code: 'UNAUTHORIZED',
    });
  }

  if (!req.organizationId) {
    return res.status(403).json({
      success: false,
      error: 'Organization onboarding required. Please create or join an organization.',
      code: 'NO_ORGANIZATION',
    });
  }

  next();
}

export function requireOrgRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
        code: 'UNAUTHORIZED',
      });
    }

    if (!req.organizationId || !req.role) {
      return res.status(403).json({
        success: false,
        error: 'Organization membership required.',
        code: 'NO_MEMBERSHIP',
      });
    }

    if (!allowedRoles.includes(req.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Your role '${req.role}' is not authorized for this operation. Requires one of: [${allowedRoles.join(', ')}]`,
        code: 'FORBIDDEN',
      });
    }

    next();
  };
}
