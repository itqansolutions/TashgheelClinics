import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { loginSchema, registerTenantSchema, verifyEmailSchema } from './auth.schema';

const router = Router();

// POST /api/auth/register (Tenant Onboarding)
router.post('/register', validate(registerTenantSchema), authController.register);

// POST /api/auth/verify-email
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);

// POST /api/auth/login
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/refresh (uses httpOnly cookie)
router.post('/refresh', authController.refresh);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// GET  /api/auth/me
router.get('/me', authenticate, authController.me);

export default router;
