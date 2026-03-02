import { Router } from 'express';
import * as clientController from './client.controller';
import { TenantGuard, requireRole } from '../../common/middleware/tenant.guard';

const router = Router();

// Apply TenantGuard to all client routes
router.use(TenantGuard);

router.get('/stats', clientController.getClientStats);
router.post('/', clientController.createClient);
router.get('/', clientController.getClients);
router.get('/:id', clientController.getClientById);
router.get('/:id/files', clientController.getClientFiles);
router.put('/:id', clientController.updateClient);
router.delete('/:id', requireRole('OWNER'), clientController.deleteClient);

export default router;
