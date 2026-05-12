import { PrismaClient } from '@prisma/client';
import { isDev } from './env';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Singleton — prevents multiple Prisma instances during hot reload in dev
const prisma =
  global.__prisma ??
  new PrismaClient({
    log: isDev ? ['query', 'warn', 'error'] : ['error'],
    errorFormat: 'pretty',
  });

if (isDev) {
  global.__prisma = prisma;
}

export default prisma;

export async function connectDB(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅  Database connected');
  } catch (error) {
    console.error('❌  Database connection failed:', error);
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  await prisma.$disconnect();
  console.log('🔌  Database disconnected');
}
