import { Router } from 'express';
import * as fileController from './file.controller';
import { TenantGuard } from '../../common/middleware/tenant.guard';

const router = Router();

// Apply TenantGuard to all file routes (File module requires tenant context)
router.use(TenantGuard);

router.post('/', fileController.create);
router.get('/', fileController.list);
router.get('/:id', fileController.getOne);
router.put('/:id', fileController.update);
router.delete('/:id', fileController.remove);

export default router;
