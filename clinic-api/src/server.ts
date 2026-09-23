import app from './app';
import { env } from './config/env';
import { connectDB, disconnectDB } from './config/db';
import { startTrialExpirationWorker } from './workers/trialExpirationWorker';
import fs from 'fs';
import path from 'path';

async function bootstrap() {
  // Ensure upload directory exists for local storage
  const uploadDir = path.join(process.cwd(), env.LOCAL_UPLOAD_DIR);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Connect to database
  await connectDB();

  // Start background workers (after DB is ready)
  startTrialExpirationWorker();

  const server = app.listen(env.PORT, () => {
    console.log(`\n🚀  Clinic API running on http://localhost:${env.PORT}`);
    console.log(`📋  Environment: ${env.NODE_ENV}`);
    console.log(`🩺  Health: http://localhost:${env.PORT}/health\n`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
