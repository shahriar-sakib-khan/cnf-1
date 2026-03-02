import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.utils';
import { UserModel } from '../../modules/auth/user.model';

// Extend express Request to include our custom user payload
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      tenantId?: string;
    }
  }
}

export const TenantGuard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Extract token from HttpOnly cookie
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No token provided' } });
    }

    // 2. Verify Token
    const payload = verifyToken(token);

    // 3. Look up user in the unified UserModel (only for isActive + tokenVersion)
    const userRecord = await UserModel.findById(payload.id)
      .select('tokenVersion isActive tenantId')
      .lean() as any;

    if (!userRecord || !userRecord.isActive) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not found or inactive' } });
    }

    // 4. Instantaneous Token Revocation via tokenVersion
    if (userRecord.tokenVersion !== payload.tokenVersion) {
      res.clearCookie('token');
      return res.status(401).json({ success: false, error: { code: 'TOKEN_REVOKED', message: 'Session has been revoked' } });
    }

    // 5. Attach user payload and tenantId to request
    // Prefer tenantId from DB (most current), then fall back to JWT payload
    req.user = payload;
    const tenantId = userRecord.tenantId?.toString() ?? payload.tenantId;

    if (tenantId) {
      req.tenantId = tenantId;
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
  }
};

// ── Role Guard Factory ────────────────────────────────────
// Usage: requireRole('OWNER', 'MANAGER')
export const requireRole = (...roles: Array<'OWNER' | 'MANAGER' | 'STAFF'>) =>
  (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `This action requires one of the following roles: ${roles.join(', ')}`
        }
      });
    }
    next();
  };
