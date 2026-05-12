import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess } from '../../utils/response';
import { env } from '../../config/env';

const COOKIE_NAME = 'refresh_token';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth',
};

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body as { email: string; password: string };
      const result = await authService.login(email, password);
      res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTS);
      sendSuccess(res, { accessToken: result.accessToken, user: result.user }, 'Login successful');
    } catch (err) { next(err); }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.[COOKIE_NAME] as string | undefined;
      if (!token) {
        res.status(401).json({ success: false, message: 'No refresh token' });
        return;
      }
      const result = await authService.refresh(token);
      res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTS);
      sendSuccess(res, { accessToken: result.accessToken }, 'Token refreshed');
    } catch (err) { next(err); }
  },

  async logout(_req: Request, res: Response) {
    res.clearCookie(COOKIE_NAME, { path: '/api/auth' });
    sendSuccess(res, null, 'Logged out');
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.me(req.user!.sub);
      sendSuccess(res, user);
    } catch (err) { next(err); }
  },
};
