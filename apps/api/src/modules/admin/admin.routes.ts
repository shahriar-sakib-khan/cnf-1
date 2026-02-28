import { Router } from 'express';
import { adminCreateOwner, adminListOwners, adminResetPassword } from '../auth/auth.controller';
import { adminGuard } from '../../common/middleware/admin.guard';

const router = Router();

// All routes require admin authentication
router.use(adminGuard);

router.post('/users', adminCreateOwner);   // Create a new owner + store
router.get('/users', adminListOwners);     // List all owners
router.put('/users/:userId/password', adminResetPassword); // Reset any user's password


export default router;
