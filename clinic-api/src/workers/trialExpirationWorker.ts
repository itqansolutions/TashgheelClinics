/**
 * Trial Expiration Worker — Phase 3.5 (Hardened)
 *
 * Runs on a cron schedule (hourly by default).
 * Uses PostgreSQL transaction-level advisory lock (pg_advisory_xact_lock) to prevent
 * race conditions when multiple API server instances are running simultaneously.
 *
 * Architecture & Concurrency Guarantees:
 * 1. The lock AND the entire worker database execution share the EXACT SAME transaction `tx`.
 * 2. `pg_advisory_xact_lock` is held for the lifetime of `tx`, releasing automatically on COMMIT.
 * 3. 100% safe with connection poolers like PgBouncer in both transaction and session modes.
 * 4. Side-effects (emails, LRU cache eviction) are staged and only executed AFTER `tx` commits,
 *    ensuring:
 *    a) The DB lock is held for milliseconds (only during pure SQL queries).
 *    b) No phantom emails are dispatched if the DB transaction encounters an error and rolls back.
 */

import cron from 'node-cron';
import { Prisma } from '@prisma/client';
import { rawPrisma } from '../config/db';
import { invalidateTenantCache } from '../middleware/resolveTenant';

// Advisory Lock Key — unique integer for this specific background task
const TRIAL_EXPIRATION_LOCK_KEY = BigInt(1001);

// Email Service stub (Nodemailer/Sendgrid)
const emailService = {
  async sendTrialExpiredEmail(to: string, clinicName: string) {
    console.info(`[Email] Trial expired notification sent to ${to} (${clinicName})`);
  },
  async sendTrialWarningEmail(to: string, clinicName: string, daysLeft: number) {
    console.info(`[Email] Trial warning (${daysLeft}d left) sent to ${to} (${clinicName})`);
  },
  async sendCancellationEmail(to: string, clinicName: string) {
    console.info(`[Email] Cancellation (30d retention expired) sent to ${to} (${clinicName})`);
  },
};

interface StagedNotification {
  type:       'TRIAL_EXPIRED' | 'TRIAL_WARNING' | 'CANCELLED';
  to:         string;
  clinicName: string;
  tenantId:   number;
  daysLeft?:  number;
}

/**
 * Executes trial expirations, warnings, and cancellations entirely inside `tx`.
 * Returns staged notifications to be dispatched after commit.
 */
async function expireTrials(tx: Prisma.TransactionClient): Promise<StagedNotification[]> {
  const now = new Date();
  const notifications: StagedNotification[] = [];

  // ── 1. Expire TRIAL subscriptions past their endDate ───────────────────────
  const expiredTrials = await tx.subscription.findMany({
    where: {
      status:  'TRIAL',
      endDate: { lte: now },
      tenant:  { status: 'ACTIVE' },
    },
    include: {
      tenant: { select: { id: true, name: true, contactEmail: true } },
    },
  });

  for (const sub of expiredTrials) {
    await tx.subscription.update({
      where: { id: sub.id },
      data:  { status: 'CANCELLED' },
    });

    await tx.tenant.update({
      where: { id: sub.tenantId },
      data:  { status: 'SUSPENDED', updatedAt: now },
    });

    notifications.push({
      type:       'TRIAL_EXPIRED',
      to:         sub.tenant.contactEmail,
      clinicName: sub.tenant.name,
      tenantId:   sub.tenantId,
    });
  }

  // ── 2. Send warning emails (idempotent via trialWarningSentAt) ─────────────
  const warningThreshold = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

  const soonExpiring = await tx.subscription.findMany({
    where: {
      status:             'TRIAL',
      trialWarningSentAt: null, // Idempotency guard — never re-send
      endDate: {
        gte: now,
        lte: warningThreshold,
      },
      tenant: { status: 'ACTIVE' },
    },
    include: {
      tenant: { select: { id: true, name: true, contactEmail: true } },
    },
  });

  for (const sub of soonExpiring) {
    const daysLeft = Math.max(1, Math.ceil((sub.endDate!.getTime() - now.getTime()) / 86_400_000));

    // Mark warning sent in DB
    await tx.subscription.update({
      where: { id: sub.id },
      data:  { trialWarningSentAt: now },
    });

    notifications.push({
      type:       'TRIAL_WARNING',
      to:         sub.tenant.contactEmail,
      clinicName: sub.tenant.name,
      tenantId:   sub.tenantId,
      daysLeft,
    });
  }

  // ── 3. Cancel SUSPENDED tenants past 30-day data retention ─────────────────
  const retentionDeadline = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const toCancel = await tx.tenant.findMany({
    where: {
      status:    'SUSPENDED',
      updatedAt: { lte: retentionDeadline },
    },
    select: { id: true, name: true, contactEmail: true },
  });

  for (const tenant of toCancel) {
    await tx.tenant.update({
      where: { id: tenant.id },
      data:  { status: 'CANCELLED', updatedAt: now },
    });

    notifications.push({
      type:       'CANCELLED',
      to:         tenant.contactEmail,
      clinicName: tenant.name,
      tenantId:   tenant.id,
    });
  }

  return notifications;
}

/**
 * Runs the worker with transaction-level advisory lock.
 * Lock is acquired at BEGIN and released at COMMIT/ROLLBACK.
 */
async function runWorkerWithTransactionLock(): Promise<void> {
  let stagedNotifications: StagedNotification[] = [];

  // Entire worker execution shares single transaction `tx`
  await rawPrisma.$transaction(
    async (tx) => {
      // 1. Acquire transaction-level advisory lock
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${TRIAL_EXPIRATION_LOCK_KEY})`;
      console.info(`[Worker] Transaction advisory lock ${TRIAL_EXPIRATION_LOCK_KEY} acquired.`);

      // 2. Execute all queries on the exact same `tx` client
      stagedNotifications = await expireTrials(tx);
    },
    {
      timeout: 30000, // 30 seconds max transaction duration
    }
  );

  // 3. Post-commit: dispatch emails and evict cache (outside the DB transaction)
  for (const item of stagedNotifications) {
    invalidateTenantCache(item.tenantId);

    if (item.type === 'TRIAL_EXPIRED') {
      await emailService.sendTrialExpiredEmail(item.to, item.clinicName);
    } else if (item.type === 'TRIAL_WARNING') {
      await emailService.sendTrialWarningEmail(item.to, item.clinicName, item.daysLeft ?? 4);
    } else if (item.type === 'CANCELLED') {
      await emailService.sendCancellationEmail(item.to, item.clinicName);
    }
  }

  if (stagedNotifications.length > 0) {
    console.info(`[Worker] Processed ${stagedNotifications.length} subscription lifecycle transition(s).`);
  }
}

/**
 * Starts the trial expiration cron worker.
 */
export function startTrialExpirationWorker(): void {
  cron.schedule('0 * * * *', async () => {
    try {
      await runWorkerWithTransactionLock();
    } catch (err) {
      console.error('[Worker] Trial expiration worker failed:', err);
    }
  });

  console.info('[Worker] Trial expiration worker registered — runs hourly with transaction advisory lock.');
}
