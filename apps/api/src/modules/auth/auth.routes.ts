import { Router } from 'express';
import { login, logout, getMe, changePassword, updateProfile } from './auth.controller';
import { TenantGuard } from '../../common/middleware/tenant.guard';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', TenantGuard, getMe);
router.put('/password', TenantGuard, changePassword);
router.put('/profile', TenantGuard, updateProfile);

export default router;
