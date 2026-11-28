/**
 * WhatsApp (unofficial QR pairing) — per-tenant booking notifications.
 *
 * Each clinic pairs its own WhatsApp number by scanning a QR (like WhatsApp
 * Web) from Settings → WhatsApp. Used for:
 *   1. Booking confirmation when a customer books online (/api/public/book)
 *   2. Day-before reminder for Confirmed appointments (hourly worker)
 *
 * Feature flag: WHATSAPP_UNOFFICIAL_ENABLED=true required, otherwise every
 * entry point is a no-op / 403. Never message numbers that did not book or
 * were not explicitly given as a test target by a clinic admin.
 *
 * Storage: Baileys auth state + account state live in ClinicSettings as
 * key/value rows (Railway filesystem is ephemeral; no schema change needed).
 * Sent-message markers wa.log.* give idempotency for confirmations/reminders.
 */
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  initAuthCreds,
  BufferJSON,
  proto,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { rawPrisma } from '../../config/db';
import { getTenantTz } from '../../utils/tz';

const ENABLED = process.env.WHATSAPP_UNOFFICIAL_ENABLED === 'true';
const PUBLIC_APP_URL = process.env.PUBLIC_APP_URL || 'https://tashgheelclinics.itqansolutions.org';
const logger = pino({ level: 'warn' });

export type WaStatus = 'DISABLED' | 'DISCONNECTED' | 'CONNECTING' | 'QR_PENDING' | 'CONNECTED';

interface Session {
  sock: ReturnType<typeof makeWASocket> | null;
  status: WaStatus;
  qr: string | null;
  phone: string | null;
  retryDelay: number;
  intentionalClose?: boolean;
}

const sessions = new Map<number, Session>();

export function isWhatsAppEnabled(): boolean {
  return ENABLED;
}

// ── ClinicSettings helpers (rawPrisma: service works cross-tenant) ──────────
async function getSetting(tenantId: number, key: string): Promise<string | null> {
  const row = await rawPrisma.clinicSetting.findFirst({ where: { tenantId, key } });
  return row?.value ?? null;
}

async function setSetting(tenantId: number, key: string, value: string): Promise<void> {
  const existing = await rawPrisma.clinicSetting.findFirst({ where: { tenantId, key } });
  if (existing) {
    await rawPrisma.clinicSetting.update({ where: { id: existing.id }, data: { value } });
  } else {
    await rawPrisma.clinicSetting.create({ data: { tenantId, key, value } });
  }
}

async function deleteSettings(tenantId: number, prefix: string): Promise<void> {
  await rawPrisma.clinicSetting.deleteMany({ where: { tenantId, key: { startsWith: prefix } } });
}

// ── Baileys auth state backed by ClinicSettings ─────────────────────────────
async function useDbAuthState(tenantId: number) {
  const prefix = 'wa.auth.';

  const read = async (k: string): Promise<any> => {
    const v = await getSetting(tenantId, prefix + k);
    return v ? JSON.parse(v, BufferJSON.reviver) : null;
  };
  const write = async (k: string, v: any): Promise<void> => {
    await setSetting(tenantId, prefix + k, JSON.stringify(v, BufferJSON.replacer));
  };
  const remove = async (k: string): Promise<void> => {
    await deleteSettings(tenantId, prefix + k);
  };

  const creds = (await read('creds')) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type: string, ids: string[]) => {
          const out: Record<string, any> = {};
          await Promise.all(
            ids.map(async (id) => {
              let v = await read(`${type}-${id}`);
              if (type === 'app-state-sync-key' && v) {
                v = proto.Message.AppStateSyncKeyData.fromObject(v);
              }
              out[id] = v ?? undefined;
            })
          );
          return out;
        },
        set: async (data: Record<string, Record<string, any>>) => {
          for (const category of Object.keys(data)) {
            for (const id of Object.keys(data[category])) {
              const v = data[category][id];
              const k = `${category}-${id}`;
              if (v) await write(k, v);
              else await remove(k);
            }
          }
        },
      },
    },
    saveCreds: () => write('creds', creds),
    clearAuth: () => deleteSettings(tenantId, prefix),
  };
}

// ── Public status ────────────────────────────────────────────────────────────
export async function getWhatsAppStatus(tenantId: number) {
  const sess = sessions.get(tenantId);
  const stored = await getSetting(tenantId, 'wa.status');
  const storedPhone = await getSetting(tenantId, 'wa.phone');
  const status: WaStatus = !ENABLED ? 'DISABLED' : sess?.status ?? ((stored as WaStatus) || 'DISCONNECTED');
  return {
    enabled: ENABLED,
    status,
    phone: sess?.phone ?? storedPhone,
    qr: sess?.status === 'QR_PENDING' ? sess.qr : null,
    sendBookingConfirmation: (await getSetting(tenantId, 'wa.sendConfirmation')) !== 'false',
    sendDayBeforeReminder: (await getSetting(tenantId, 'wa.sendReminder')) !== 'false',
    lastError: await getSetting(tenantId, 'wa.lastError'),
  };
}

export async function updateWhatsAppToggles(
  tenantId: number,
  toggles: { sendBookingConfirmation?: boolean; sendDayBeforeReminder?: boolean }
) {
  if (toggles.sendBookingConfirmation !== undefined) {
    await setSetting(tenantId, 'wa.sendConfirmation', String(toggles.sendBookingConfirmation));
  }
  if (toggles.sendDayBeforeReminder !== undefined) {
    await setSetting(tenantId, 'wa.sendReminder', String(toggles.sendDayBeforeReminder));
  }
  return getWhatsAppStatus(tenantId);
}

// ── Connect / disconnect ─────────────────────────────────────────────────────
export async function connectWhatsApp(tenantId: number): Promise<void> {
  if (!ENABLED) throw new Error('WhatsApp feature is disabled');
  const existing = sessions.get(tenantId);
  if (existing?.sock) return;

  const sess: Session = existing ?? { sock: null, status: 'CONNECTING', qr: null, phone: null, retryDelay: 2000 };
  sess.intentionalClose = false;
  sessions.set(tenantId, sess);

  const { state, saveCreds, clearAuth } = await useDbAuthState(tenantId);
  const { version } = await fetchLatestBaileysVersion();

  sess.status = 'CONNECTING';
  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: false,
    browser: ['Tashgheel Clinics', 'Chrome', '1.0.0'],
    syncFullHistory: false,
    markOnlineOnConnect: false,
  });
  sess.sock = sock;

  sock.ev.on('creds.update', () => {
    saveCreds().catch((e) => console.warn(`[WA] creds save failed (tenant ${tenantId}):`, e?.message));
  });

  sock.ev.on('connection.update', (update) => {
    void (async () => {
      const { connection, lastDisconnect, qr } = update;
      try {
        if (qr) {
          sess.qr = qr;
          sess.status = 'QR_PENDING';
          await setSetting(tenantId, 'wa.status', 'QR_PENDING');
        }
        if (connection === 'open') {
          sess.status = 'CONNECTED';
          sess.qr = null;
          sess.retryDelay = 2000;
          sess.phone = sock.user?.id?.split(':')[0]?.split('@')[0] ?? null;
          await setSetting(tenantId, 'wa.status', 'CONNECTED');
          if (sess.phone) await setSetting(tenantId, 'wa.phone', sess.phone);
          await setSetting(tenantId, 'wa.lastConnectedAt', new Date().toISOString());
          await setSetting(tenantId, 'wa.lastError', '');
          console.info(`[WA] tenant ${tenantId} connected as ${sess.phone}`);
        }
        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const loggedOut = statusCode === DisconnectReason.loggedOut;
          sess.sock = null;
          sess.qr = null;
          if (loggedOut || sess.intentionalClose) {
            sess.status = 'DISCONNECTED';
            await clearAuth();
            await setSetting(tenantId, 'wa.status', 'DISCONNECTED');
            await setSetting(tenantId, 'wa.phone', '');
          } else {
            // Transient drop — reconnect with backoff while the account should stay live
            sess.status = 'CONNECTING';
            const delay = Math.min(sess.retryDelay, 60000);
            sess.retryDelay = Math.min(sess.retryDelay * 2, 60000);
            console.warn(`[WA] tenant ${tenantId} connection closed (${statusCode}), retry in ${delay}ms`);
            setTimeout(() => {
              connectWhatsApp(tenantId).catch((e) =>
                console.warn(`[WA] reconnect failed (tenant ${tenantId}):`, e?.message)
              );
            }, delay);
          }
        }
      } catch (e: any) {
        console.warn(`[WA] connection.update handler error (tenant ${tenantId}):`, e?.message);
      }
    })();
  });
}

export async function disconnectWhatsApp(tenantId: number): Promise<void> {
  const sess = sessions.get(tenantId);
  if (sess) {
    sess.intentionalClose = true;
    try {
      await sess.sock?.logout();
    } catch {
      /* already closed */
    }
    try {
      sess.sock?.end(undefined);
    } catch {
      /* noop */
    }
    sessions.delete(tenantId);
  }
  await deleteSettings(tenantId, 'wa.auth.');
  await setSetting(tenantId, 'wa.status', 'DISCONNECTED');
  await setSetting(tenantId, 'wa.phone', '');
}

/** Re-open sockets for tenants that were connected before a restart/deploy. */
export async function resumeWhatsAppSessions(): Promise<void> {
  if (!ENABLED) return;
  try {
    const rows = await rawPrisma.clinicSetting.findMany({
      where: { key: 'wa.status', value: { in: ['CONNECTED', 'QR_PENDING'] } },
      select: { tenantId: true },
    });
    for (const row of rows) {
      if (row.tenantId == null) continue;
      connectWhatsApp(row.tenantId).catch((e) =>
        console.warn(`[WA] resume failed (tenant ${row.tenantId}):`, e?.message)
      );
    }
    if (rows.length) console.info(`[WA] resuming ${rows.length} session(s)`);
  } catch (e: any) {
    console.warn('[WA] resume scan failed:', e?.message);
  }
}

// ── Sending ──────────────────────────────────────────────────────────────────
/** Normalize to international digits. Egyptian default: 01xxxxxxxxx → 201xxxxxxxxx. */
export function normalizePhone(raw: string, defaultCountryCode = '20'): string | null {
  let digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = defaultCountryCode + digits.slice(1);
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

export async function sendWhatsAppText(tenantId: number, rawPhone: string, text: string): Promise<void> {
  if (!ENABLED) throw new Error('WhatsApp feature is disabled');
  const sess = sessions.get(tenantId);
  if (!sess?.sock || sess.status !== 'CONNECTED') {
    throw new Error('WhatsApp is not connected for this clinic');
  }
  const phone = normalizePhone(rawPhone);
  if (!phone) throw new Error(`Invalid phone number: ${rawPhone}`);
  const jid = `${phone}@s.whatsapp.net`;
  const result = await sess.sock.onWhatsApp(jid);
  const check = result?.[0];
  if (!check?.exists) throw new Error(`Number is not on WhatsApp: ${phone}`);
  await sess.sock.sendMessage(jid, { text });
}

// ── Message templates ────────────────────────────────────────────────────────
function fmtDateTime(d: Date, tz: string): string {
  return new Intl.DateTimeFormat('ar-EG', {
    timeZone: tz,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

async function buildContext(tenantId: number, appointmentId: number) {
  const appt = await rawPrisma.appointment.findFirst({
    where: { id: appointmentId, tenantId },
    include: {
      patient: true,
      doctor: { include: { user: true } },
      service: true,
      tenant: true,
    },
  });
  if (!appt || !appt.tenant) return null;
  const tz = await getTenantTz(rawPrisma);
  const address = (await getSetting(tenantId, 'clinic_address')) || (await getSetting(tenantId, 'address')) || '';
  const doctorName = appt.doctor?.user?.fullName || appt.doctor?.fullName || '';
  const link = `${PUBLIC_APP_URL}/book/${appt.tenant.slug}`;
  return { appt, tz, address, doctorName, link, clinicName: appt.tenant.name };
}

export function confirmationMessage(c: Awaited<ReturnType<typeof buildContext>> & object): string {
  const lines = [
    `أهلاً ${c.appt.patient.fullName} 👋`,
    `تم استلام حجزك في ${c.clinicName} ✅`,
    `👨‍⚕️ الدكتور: د. ${c.doctorName}`,
    `📅 الموعد: ${fmtDateTime(c.appt.startTime, c.tz)}`,
  ];
  if (c.address) lines.push(`📍 العنوان: ${c.address}`);
  lines.push(`🔗 ملفك وحجوزاتك أونلاين: ${c.link}`);
  lines.push('لو محتاج تعدّل أو تلغي الموعد رد على الرسالة دي.');
  return lines.join('\n');
}

export function reminderMessage(c: Awaited<ReturnType<typeof buildContext>> & object): string {
  const lines = [
    `تذكير بموعدك بكرة في ${c.clinicName} ⏰`,
    `👨‍⚕️ الدكتور: د. ${c.doctorName}`,
    `📅 الموعد: ${fmtDateTime(c.appt.startTime, c.tz)}`,
  ];
  if (c.address) lines.push(`📍 العنوان: ${c.address}`);
  lines.push('لو مش هتقدر تيجي رد علينا هنا عشان نحجز ميعاد لحد تاني.');
  return lines.join('\n');
}

// ── Business entry points (fire-and-forget safe) ─────────────────────────────
export async function sendBookingConfirmation(tenantId: number, appointmentId: number): Promise<void> {
  if (!ENABLED) return;
  if ((await getSetting(tenantId, 'wa.sendConfirmation')) === 'false') return;
  const sess = sessions.get(tenantId);
  if (!sess || sess.status !== 'CONNECTED') return;
  const marker = `wa.log.confirm.${appointmentId}`;
  if (await getSetting(tenantId, marker)) return;
  const ctx = await buildContext(tenantId, appointmentId);
  if (!ctx?.appt.patient?.phone) return;
  try {
    await sendWhatsAppText(tenantId, ctx.appt.patient.phone, confirmationMessage(ctx));
    await setSetting(tenantId, marker, new Date().toISOString());
    console.info(`[WA] booking confirmation sent for appointment ${appointmentId} (tenant ${tenantId})`);
  } catch (e: any) {
    console.warn(`[WA] booking confirmation failed (appt ${appointmentId}):`, e?.message);
    await setSetting(tenantId, 'wa.lastError', String(e?.message || e));
  }
}

export { buildContext, setSetting as setWaSetting, getSetting as getWaSetting };
