import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.utils';
import { UserModel } from '../../modules/auth/user.model';

/**
 * AdminGuard — only allows through users with userType === 'ADMIN'.
 * Must be placed BEFORE TenantGuard on admin routes.
 */
export const adminGuard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      res.status(401).json({ success: false, error: { code: 'NO_TOKEN', message: 'Authentication required' } });
      return;
    }

    const payload = verifyToken(token);

    const user = await UserModel.findById(payload.id)
      .select('tokenVersion isActive userType')
      .lean() as any;

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not found or inactive' } });
      return;
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      res.clearCookie('token');
      res.status(401).json({ success: false, error: { code: 'TOKEN_REVOKED', message: 'Session revoked' } });
      return;
    }

    if (user.userType !== 'ADMIN') {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } });
      return;
    }

    req.user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } });
  }
};
