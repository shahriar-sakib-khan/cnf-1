import { Router } from 'express';
import * as clientController from './client.controller';
import { TenantGuard } from '../../common/middleware/tenant.guard';

const router = Router();

// Apply TenantGuard to all client routes
router.use(TenantGuard);

router.post('/', clientController.createClient);
router.get('/', clientController.getClients);
router.get('/:id', clientController.getClientById);
router.put('/:id', clientController.updateClient);
router.delete('/:id', clientController.deleteClient);

export default router;
