import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../../middleware/auth';
import { adminOnly, rbac } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { createUserSchema, updateUserSchema, changePasswordSchema, listQuerySchema } from './users.schema';

const router = Router();
const adminOrManager = rbac('Admin', 'Manager');

// All routes require auth
router.use(authenticate);

router.get('/',    adminOrManager, validate(listQuerySchema, 'query'), usersController.list);
router.get('/:id', adminOrManager, usersController.getById);

// Admin only sensitive actions
router.post('/',   adminOnly, validate(createUserSchema), usersController.create);
router.put('/:id', adminOnly, validate(updateUserSchema), usersController.update);
router.patch('/:id/password', adminOnly, validate(changePasswordSchema), usersController.changePassword);
router.delete('/:id', adminOnly, usersController.deactivate);

export default router;
