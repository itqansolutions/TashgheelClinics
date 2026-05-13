import { Router } from 'express';
import { stockController } from './stock.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// Apply auth to all stock routes
router.use(authenticate);

// Balance & Purchases
router.get('/balance', authorize(['Admin']), stockController.getBalances);
router.post('/purchase', authorize(['Admin']), stockController.recordPurchase);

// Products
router.get('/products', stockController.getProducts);
router.post('/products', authorize(['Admin']), stockController.createProduct);

// Vendors
router.get('/vendors', authorize(['Admin']), stockController.getVendors);
router.post('/vendors', authorize(['Admin']), stockController.createVendor);
router.get('/vendors/:id/statement', authorize(['Admin']), stockController.getVendorStatement);
router.post('/vendors/payment', authorize(['Admin']), stockController.recordVendorPayment);

export default router;
