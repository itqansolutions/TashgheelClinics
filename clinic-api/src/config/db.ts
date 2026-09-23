import { PrismaClient } from '@prisma/client';
import { isDev } from './env';
import { tenantStorage } from '../utils/tenantStorage';
import { tenantPrisma } from '../utils/tenantPrisma';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Singleton — raw base PrismaClient
export const rawPrisma =
  global.__prisma ??
  new PrismaClient({
    log: isDev ? ['query', 'warn', 'error'] : ['error'],
    errorFormat: 'pretty',
  });

if (isDev) {
  global.__prisma = rawPrisma;
}

/**
 * Proxied Prisma instance:
 * 1. Inside an HTTP request with active TenantContext (via tenantStorage):
 *    Automatically routes queries through tenantPrisma(tenantId) for all TENANT_MODELS.
 * 2. System Admin requests or scripts (where store is null or systemRole is set):
 *    Directly routes to raw base PrismaClient without tenant filtering.
 */
const prisma = new Proxy(rawPrisma, {
  get(target, prop, receiver) {
    const store = tenantStorage.getStore();
    if (store?.tenantId && !store.systemRole) {
      const scoped = tenantPrisma(store.tenantId);
      const val = Reflect.get(scoped, prop);
      return typeof val === 'function' ? val.bind(scoped) : val;
    }
    const val = Reflect.get(target, prop, receiver);
    return typeof val === 'function' ? val.bind(target) : val;
  },
}) as PrismaClient;

export default prisma;

export async function connectDB(): Promise<void> {
  try {
    await rawPrisma.$connect();
    console.log('✅  Database connected');
  } catch (error) {
    console.error('❌  Database connection failed:', error);
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  await rawPrisma.$disconnect();
  console.log('🔌  Database disconnected');
}
