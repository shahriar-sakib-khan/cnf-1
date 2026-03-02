import { Router } from 'express';
import { reportController } from './report.controller';
import { TenantGuard, requireRole } from '../../common/middleware/tenant.guard';
import { asyncHandler } from '../../common/utils/async-handler';

const router = Router();

// Reports and invoicing require authentication and OWNER role
router.use(TenantGuard);
router.use(requireRole('OWNER'));

router.get('/files', asyncHandler(reportController.getFilesForReport));
router.get('/invoice/:fileId/:type', asyncHandler(reportController.getInvoice));
router.post('/invoice', asyncHandler(reportController.upsertInvoice));

router.get('/template/:type', asyncHandler(reportController.getTemplate));
router.post('/template', asyncHandler(reportController.upsertTemplate));

export default router;
