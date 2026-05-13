import { Router } from 'express';
import { stockController } from './stock.controller';
import { authenticate } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';

const router = Router();

// Apply auth to all stock routes
router.use(authenticate);

// Balance & Purchases
router.get('/balance', rbac('Admin', 'Manager', 'Accountant'), stockController.getBalances);
router.post('/purchase', rbac('Admin', 'Manager'), stockController.recordPurchase);

// Products
router.get('/products', stockController.getProducts);
router.post('/products', rbac('Admin', 'Manager'), stockController.createProduct);
router.put('/products/:id', rbac('Admin', 'Manager'), stockController.updateProduct);

// Vendors
router.get('/vendors', rbac('Admin', 'Manager', 'Accountant'), stockController.getVendors);
router.post('/vendors', rbac('Admin', 'Manager'), stockController.createVendor);
router.get('/vendors/:id/statement', rbac('Admin', 'Manager', 'Accountant'), stockController.getVendorStatement);
router.post('/vendors/payment', rbac('Admin', 'Manager', 'Accountant'), stockController.recordVendorPayment);

// Ledger
router.get('/ledger/:id', rbac('Admin', 'Manager', 'Accountant'), stockController.getProductLedger);

export default router;
