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
      .select('tokenVersion isActive storeId')
      .lean();

    if (!userRecord || !userRecord.isActive) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not found or inactive' } });
    }

    // 4. Instantaneous Token Revocation via tokenVersion
    if (userRecord.tokenVersion !== payload.tokenVersion) {
      res.clearCookie('token');
      return res.status(401).json({ success: false, error: { code: 'TOKEN_REVOKED', message: 'Session has been revoked' } });
    }

    // 5. Attach user payload and tenantId to request
    // Prefer storeId from DB (most current), then fall back to JWT payload
    req.user = payload;
    const storeId = userRecord.storeId?.toString() ?? payload.storeId;
    if (storeId) {
      req.tenantId = storeId;
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
  }
};
