import crypto from 'crypto';

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.JWT_SECRET || 'fairqueue-production-secret-key-2026';
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days session

export const authService = {
  // Hash password using native PBKDF2 with unique cryptographic salt
  hashPassword(password) {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string.');
    }
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  },

  // Verify password against stored salt:hash using timing-safe equality
  verifyPassword(password, storedHash) {
    if (!password || !storedHash || !storedHash.includes(':')) return false;
    const [salt, originalHash] = storedHash.split(':');
    const computedHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(computedHash, 'hex'));
    } catch (e) {
      return false;
    }
  },

  // Generate lightweight signed JWT token using native crypto
  createToken(user, organizationId = null, role = null) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      userId: user.userId || user._id,
      email: user.email,
      name: user.name,
      organizationId: organizationId || user.organizationId || null,
      role: role || user.role || null,
      exp: Date.now() + TOKEN_EXPIRY_MS,
    })).toString('base64url');

    const signature = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    return `${header}.${payload}.${signature}`;
  },

  // Verify and decode JWT token
  verifyToken(token) {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    try {
      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      if (decoded.exp && Date.now() > decoded.exp) {
        return null; // Expired
      }
      return decoded;
    } catch (e) {
      return null;
    }
  },

  // Generate cryptographically secure random token (for invites, resets)
  generateSecureToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
  },

  // Hash arbitrary token (for stored invite / reset tokens)
  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  },

  // Cookie options for secure HTTP-only session cookie
  getSessionCookieOptions() {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/',
      maxAge: TOKEN_EXPIRY_MS,
    };
  },
};
