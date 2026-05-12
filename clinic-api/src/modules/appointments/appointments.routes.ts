import { Router } from 'express';
import { appointmentsController } from './appointments.controller';
import { authenticate } from '../../middleware/auth';
import { rbac, adminOrReception } from '../../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/',     appointmentsController.getAll);
router.get('/:id',  appointmentsController.getOne);
router.post('/',    appointmentsController.create);
router.patch('/:id', appointmentsController.update);
router.patch('/:id/status', adminOrReception, appointmentsController.updateStatus);
router.delete('/:id', appointmentsController.cancel);

export default router;
