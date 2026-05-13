import { Router } from 'express';
import { financeController } from './finance.controller';
import { authenticate } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';

const router = Router();

// All finance routes require authentication and specific roles
router.use(authenticate);
router.use(rbac('Admin', 'Manager', 'Accountant'));

router.get('/queue', financeController.getQueue);
router.get('/transactions', financeController.getTransactions);
router.post('/transactions', financeController.createTransaction);
router.post('/collect', financeController.collectPayment);
router.get('/settings', financeController.getSettings);
router.put('/settings', financeController.updateSettings);

export default router;
