import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { loginSchema, registerTenantSchema, verifyEmailSchema } from './auth.schema';

const router = Router();

// POST /api/auth/register (Tenant Onboarding)
router.post('/register', validate(registerTenantSchema), authController.register);

// POST /api/auth/verify-email
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);

// POST /api/auth/login
// Brute-force protection: 10 failed attempts per 15 min per IP + email
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.body?.email || req.ip).toLowerCase(),
  message: { success: false, message: 'Too many failed login attempts. Try again in 15 minutes.' },
});
router.post('/login', loginLimiter, validate(loginSchema), authController.login);

router.post('/change-password', authenticate,
  validate(z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) })),
  authController.changePassword);

// POST /api/auth/refresh (uses httpOnly cookie)
router.post('/refresh', authController.refresh);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// GET  /api/auth/me
router.get('/me', authenticate, authController.me);

export default router;
