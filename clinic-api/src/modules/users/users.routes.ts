import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { usersController } from './users.controller';
import { authenticate } from '../../middleware/auth';
import { adminOnly, rbac } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { createUserSchema, updateUserSchema, changePasswordSchema, resetPasswordSchema, listQuerySchema } from './users.schema';

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
// Admin resets a staff member's password (no email flow): no current password needed
router.post('/:id/reset-password', adminOnly, validate(resetPasswordSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const target = await req.db!.user.findFirst({ where: { id } });
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });
    const hash = await bcrypt.hash(req.body.newPassword, 12);
    await req.db!.user.update({ where: { id }, data: { passwordHash: hash } });
    res.json({ success: true, message: 'Password reset' });
  } catch (e) { next(e); }
});
router.delete('/:id', adminOnly, usersController.deactivate);

export default router;
