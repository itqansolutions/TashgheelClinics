/**
 * WhatsApp Day-Before Reminder Worker
 *
 * Hourly. For every tenant with a CONNECTED WhatsApp session and the reminder
 * toggle on, finds Confirmed appointments starting on the tenant's NEXT local
 * day and sends each patient a reminder from the clinic's own number.
 *
 * Idempotency: a wa.log.reminder.<appointmentId> ClinicSettings marker is
 * written per successful send, so restarts and overlapping runs never resend.
 *
 * Concurrency: PostgreSQL advisory lock (same pattern as trialExpirationWorker)
 * so multiple API instances never double-send.
 */
import cron from 'node-cron';
import { Prisma } from '@prisma/client';
import { rawPrisma } from '../config/db';
import {
  isWhatsAppEnabled,
  getWhatsAppStatus,
  sendWhatsAppText,
  buildContext,
  reminderMessage,
  setWaSetting,
  getWaSetting,
} from '../modules/whatsapp/whatsapp.service';

const REMINDER_LOCK_KEY = BigInt(1003);

async function runReminders(): Promise<void> {
  if (!isWhatsAppEnabled()) return;

  // Tenants whose WhatsApp is marked connected
  const connected = await rawPrisma.clinicSetting.findMany({
    where: { key: 'wa.status', value: 'CONNECTED' },
    select: { tenantId: true },
  });

  for (const row of connected) {
    const tenantId = row.tenantId;
    if (tenantId == null) continue;
    try {
      const status = await getWhatsAppStatus(tenantId);
      if (status.status !== 'CONNECTED' || !status.sendDayBeforeReminder) continue;

      const { getTenantTz, zonedToUtc, toZoned } = await import('../utils/tz');
      const tz = await getTenantTz(rawPrisma);
      const now = new Date();
      const today = toZoned(now, tz).ymd;
      const tomorrowDate = new Date(`${today}T00:00:00Z`);
      tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
      const ty = tomorrowDate.toISOString().slice(0, 10);
      const dayStart = zonedToUtc(ty, 0, 0, tz);
      const dayEnd = zonedToUtc(ty, 23, 59, tz);

      const appointments = await rawPrisma.appointment.findMany({
        where: {
          tenantId,
          status: 'Confirmed',
          startTime: { gte: dayStart, lte: dayEnd },
          patient: { phone: { not: null } },
        },
        select: { id: true },
      });

      for (const appt of appointments) {
        const marker = `wa.log.reminder.${appt.id}`;
        if (await getWaSetting(tenantId, marker)) continue;
        const ctx = await buildContext(tenantId, appt.id);
        if (!ctx?.appt.patient?.phone) continue;
        try {
          await sendWhatsAppText(tenantId, ctx.appt.patient.phone, reminderMessage(ctx));
          await setWaSetting(tenantId, marker, new Date().toISOString());
          console.info(`[WA] reminder sent for appointment ${appt.id} (tenant ${tenantId})`);
        } catch (e: any) {
          console.warn(`[WA] reminder failed (appt ${appt.id}):`, e?.message);
          await setWaSetting(tenantId, 'wa.lastError', String(e?.message || e));
        }
        // Gentle pacing between sends to reduce ban risk
        await new Promise((r) => setTimeout(r, 1500));
      }
    } catch (e: any) {
      console.warn(`[WA] reminder pass failed (tenant ${tenantId}):`, e?.message);
    }
  }
}

export function startWhatsAppReminderWorker(): void {
  if (!isWhatsAppEnabled()) {
    console.info('[WA] reminder worker skipped (feature disabled)');
    return;
  }
  // 15 past every hour — avoids clumping with other workers on :00/:05
  cron.schedule('15 * * * *', async () => {
    try {
      await rawPrisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const [{ pg_try_advisory_xact_lock: acquired }] = await tx.$queryRaw<
          { pg_try_advisory_xact_lock: boolean }[]
        >`SELECT pg_try_advisory_xact_lock(${REMINDER_LOCK_KEY})`;
        if (!acquired) return;
        await runReminders();
      });
    } catch (e: any) {
      console.warn('[WA] reminder worker error:', e?.message);
    }
  });
  console.info('[WA] day-before reminder worker scheduled (hourly at :15)');
}
