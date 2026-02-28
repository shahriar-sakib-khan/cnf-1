import { Router } from 'express';
import { createStaff, listStaff } from '../auth/auth.controller';
import { TenantGuard } from '../../common/middleware/tenant.guard';

const router = Router();

// All routes require authenticated store user
router.use(TenantGuard);

router.post('/staff', createStaff);   // Owner creates staff (service enforces OWNER role)
router.get('/staff', listStaff);      // List staff in store

export default router;
