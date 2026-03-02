import { Router } from 'express';
import { createStaff, listStaff, updateStaff, tenantResetPassword } from '../auth/auth.controller';
import { TenantGuard, requireRole } from '../../common/middleware/tenant.guard';

const router = Router();

// All routes require authenticated store user
router.use(TenantGuard);

// Only OWNER can create staff
router.post('/staff', requireRole('OWNER'), createStaff);
// All roles can list staff (managers view, owner manages)
router.get('/staff', listStaff);

// OWNER and MANAGER can update staff
router.put('/staff/:userId', requireRole('OWNER', 'MANAGER'), updateStaff);

// Only OWNER can reset staff password
router.put('/staff/:userId/password', requireRole('OWNER'), tenantResetPassword);

export default router;
