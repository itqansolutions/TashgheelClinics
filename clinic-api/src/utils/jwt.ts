import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  sub:         number;        // userId
  role:        string;        // tenant-level role: Admin | Reception | Doctor | Nurse | Manager | Accountant
  tenantId:    number | null; // NULL for System Admin / Support users
  systemRole?: 'SYSTEM_ADMIN' | 'SUPPORT'; // present only for platform users
  iat?:        number;
  exp?:        number;
}

export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as unknown as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as unknown as JwtPayload;
}
