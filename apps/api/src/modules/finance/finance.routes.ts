import { Router } from 'express';
import * as financeController from './finance.controller';
import { TenantGuard } from '../../common/middleware/tenant.guard';

const router = Router();

// All routes require authenticated store user
router.use(TenantGuard);

// Staff Self-Service
router.post('/requests', financeController.requestMoney);
router.get('/my-wallet', financeController.getMyFinancials);
router.post('/settle', financeController.settleExpense);

// Oversight (Manager/Owner)
router.get('/requests', financeController.listAllRequests);
router.put('/requests/:requestId/approve', financeController.approveRequest);
router.put('/requests/:requestId/reject', financeController.rejectRequest);
router.get('/staff/:staffId', financeController.getStaffFinancials);
router.get('/files/:fileId', financeController.getFileExpenses);

export default router;
