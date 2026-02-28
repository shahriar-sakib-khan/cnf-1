import { Request, Response, NextFunction } from 'express';

export const RBACGuard = (allowedRoles: Array<'OWNER' | 'MANAGER' | 'STAFF'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
    }

    next();
  };
};
