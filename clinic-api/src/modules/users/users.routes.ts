import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../../middleware/auth';
import { adminOnly } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { createUserSchema, updateUserSchema, changePasswordSchema, listQuerySchema } from './users.schema';

const router = Router();

// All routes require auth + Admin role
router.use(authenticate, adminOnly);

router.get('/',    validate(listQuerySchema, 'query'), usersController.list);
router.get('/:id', usersController.getById);
router.post('/',   validate(createUserSchema), usersController.create);
router.put('/:id', validate(updateUserSchema), usersController.update);
router.patch('/:id/password', validate(changePasswordSchema), usersController.changePassword);
router.delete('/:id', usersController.deactivate);

export default router;
