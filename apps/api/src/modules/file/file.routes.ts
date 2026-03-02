import { Router } from 'express';
import * as fileController from './file.controller';
import { TenantGuard, requireRole } from '../../common/middleware/tenant.guard';

const router = Router();

// All routes require authenticated store user
router.use(TenantGuard);

// All roles can view files
router.get('/', fileController.list);
router.get('/:id', fileController.getOne);

// Owner and Manager can create / edit / manage documents
router.post('/', requireRole('OWNER', 'MANAGER'), fileController.create);
router.put('/:id', requireRole('OWNER', 'MANAGER'), fileController.update);
router.post('/:id/documents', requireRole('OWNER', 'MANAGER'), fileController.addDoc);
router.delete('/:id/documents/:docId', requireRole('OWNER', 'MANAGER'), fileController.removeDoc);
router.get('/:id/documents/download', fileController.downloadDocs);
router.patch('/:id/doc-status', requireRole('OWNER', 'MANAGER'), fileController.updateDocStatus);
router.post('/:id/assessment', requireRole('OWNER', 'MANAGER'), fileController.updateAssessment);
router.post('/:id/assessment/transfer', requireRole('OWNER', 'MANAGER'), fileController.transferAssessment);
router.post('/:id/assessment/reset', requireRole('OWNER', 'MANAGER'), fileController.resetAssessment);

// Only Owner can delete file
router.delete('/:id', requireRole('OWNER'), fileController.remove);

export default router;
