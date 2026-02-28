import { z } from 'zod';

// ── Login ────────────────────────────────────────────────
export const LoginSchema = z.object({
  identifier: z.string().trim().min(1, 'Email or phone is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

// ── Admin creates a new Owner account (+ store auto-created) ─
export const CreateOwnerSchema = z.object({
  name: z.string().trim().optional(),
  email: z.string().trim().email('Invalid email').optional(),
  phone: z.string().trim().min(7, 'Phone too short').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((d) => d.email || d.phone, {
  message: 'Either email or phone is required',
  path: ['email'],
});
export type CreateOwnerInput = z.infer<typeof CreateOwnerSchema>;

// ── Owner creates staff in their store ───────────────────
export const CreateStaffSchema = z.object({
  name: z.string().trim().optional(),
  email: z.string().trim().email('Invalid email').optional(),
  phone: z.string().trim().min(7, 'Phone too short').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['OWNER', 'MANAGER', 'STAFF']),
  creatorPassword: z.string().optional(),
}).refine((d) => d.email || d.phone, {
  message: 'Either email or phone is required',
  path: ['email'],
});

export type CreateStaffInput = z.infer<typeof CreateStaffSchema>;

// ── Change password (user self-service) ───────────────
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

// ── Admin reset password (override) ───────────────────
export const AdminResetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});
export type AdminResetPasswordInput = z.infer<typeof AdminResetPasswordSchema>;


// Keep old names as aliases so existing code doesn't break
export const CreateStaffByOwnerSchema = CreateStaffSchema;
export type CreateStaffByOwnerInput = CreateStaffInput;
