import { Router } from 'express';
import * as financeController from './finance.controller';
import { TenantGuard, requireRole } from '../../common/middleware/tenant.guard';

const router = Router();

// All routes require authenticated store user
router.use(TenantGuard);

// Staff Self-Service (all roles)
router.post('/requests', financeController.requestMoney);
router.get('/my-wallet', financeController.getMyFinancials);
router.post('/settle', financeController.settleExpense);

// Oversight – Owner + Manager only
router.get('/requests', requireRole('OWNER', 'MANAGER'), financeController.listAllRequests);
router.get('/expenses', requireRole('OWNER', 'MANAGER'), financeController.listAllExpenses);
router.put('/requests/:requestId/approve', requireRole('OWNER', 'MANAGER'), financeController.approveRequest);
router.put('/requests/:requestId/reject', requireRole('OWNER', 'MANAGER'), financeController.rejectRequest);
router.put('/requests/:requestId/archive', requireRole('OWNER', 'MANAGER'), financeController.archiveRequest);
router.put('/requests/:requestId/unarchive', requireRole('OWNER', 'MANAGER'), financeController.unarchiveRequest);
router.get('/staff/:staffId', requireRole('OWNER', 'MANAGER'), financeController.getStaffFinancials);

// File finance (visible to all, service enforces tenant)
router.get('/files/:fileId', financeController.getFileExpenses);

// Category Management
router.get('/categories', financeController.listCategories);
router.post('/categories', requireRole('OWNER', 'MANAGER'), financeController.createCategory);
router.put('/categories/:id', requireRole('OWNER', 'MANAGER'), financeController.updateCategory);

// Dashboard (Owner + Manager)
router.get('/dashboard', requireRole('OWNER', 'MANAGER'), financeController.getDashboardStats);

export default router;
