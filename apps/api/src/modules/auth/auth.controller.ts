import { Request, Response } from 'express';
import * as authService from './auth.service';
import {
  LoginSchema,
  CreateOwnerSchema,
  CreateStaffSchema,
  ChangePasswordSchema,
  AdminResetPasswordSchema
} from '@repo/shared';

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// POST /api/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, password } = LoginSchema.parse(req.body);
  const { user, token } = await authService.login(identifier, password);

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
    ...(process.env.NODE_ENV === 'production' ? { secure: true } : {}),
  });

  res.status(200).json({ success: true, data: user });
});

// POST /api/auth/logout
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.status(200).json({ success: true, data: { message: 'Logged out' } });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.id);
  if (!user) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
  res.status(200).json({ success: true, data: user });
});

// PUT /api/auth/password
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = ChangePasswordSchema.parse(req.body);
  await authService.changePassword(req.user!.id, currentPassword, newPassword);
  res.clearCookie('token'); // force re-login after password change
  res.status(200).json({ success: true, data: { message: 'Password changed. Please log in again.' } });
});

// ── Admin endpoints ──────────────────────────────────────

// POST /api/admin/users  (admin creates owner + store)
export const adminCreateOwner = asyncHandler(async (req: Request, res: Response) => {
  const data = CreateOwnerSchema.parse(req.body);
  const result = await authService.createOwner(data, req.user!.id);
  res.status(201).json({ success: true, data: result });
});

// GET /api/admin/users
export const adminListOwners = asyncHandler(async (_req: Request, res: Response) => {
  const result = await authService.listAllOwners();
  res.status(200).json({ success: true, data: result });
});

// PUT /api/admin/users/:userId/password
export const adminResetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { newPassword } = AdminResetPasswordSchema.parse(req.body);

  await authService.adminResetUserPassword(userId, newPassword);

  res.status(200).json({
    success: true,
    data: { message: 'Password reset successfully. User will be logged out of other devices.' }
  });
});

// ── Store endpoints ──────────────────────────────────────

// POST /api/store/staff  (owner creates staff in their store)
export const createStaff = asyncHandler(async (req: Request, res: Response) => {
  const data = CreateStaffSchema.parse(req.body);
  const result = await authService.createStaffMember(req.user!.id, data);
  res.status(201).json({ success: true, data: result });
});

// GET /api/store/staff
export const listStaff = asyncHandler(async (req: Request, res: Response) => {
  if (!req.tenantId) {
    return res.status(403).json({ success: false, error: { code: 'NO_STORE_CONTEXT', message: 'No store context' } });
  }
  const result = await authService.listStoreStaff(req.tenantId);
  res.status(200).json({ success: true, data: result });
});
