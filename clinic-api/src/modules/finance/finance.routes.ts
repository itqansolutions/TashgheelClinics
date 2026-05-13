import { Router } from 'express';
import { financeController } from './finance.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// All finance routes require authentication and specific roles
router.use(authenticate);
router.use(authorize(['Admin', 'Finance Manager', 'Accountant']));

router.get('/queue', financeController.getQueue);
router.get('/transactions', financeController.getTransactions);
router.post('/transactions', financeController.createTransaction);
router.post('/collect', financeController.collectPayment);
router.get('/settings', financeController.getSettings);
router.put('/settings', financeController.updateSettings);

export default router;
