// Per-clinic timezone helpers (no extra dependencies). Clinic timezone is stored in
// ClinicSetting key "timezone" (IANA name) and defaults to Africa/Cairo.
export const DEFAULT_TZ = 'Africa/Cairo';

export async function getTenantTz(db: any): Promise<string> {
  try {
    const s = await db.clinicSetting.findFirst({ where: { key: 'timezone' } });
    const tz = s?.value;
    if (tz && isValidTz(tz)) return tz;
  } catch { /* fall through */ }
  return DEFAULT_TZ;
}

export function isValidTz(tz: string): boolean {
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch { return false; }
}

function parts(d: Date, tz: string) {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const o: Record<string, string> = {};
  for (const p of f.formatToParts(d)) o[p.type] = p.value;
  return o;
}

/** Wall-clock components of an instant in the clinic timezone. */
export function toZoned(d: Date, tz: string) {
  const p = parts(d, tz);
  const ymd = `${p.year}-${p.month}-${p.day}`;
  const hhmm = `${p.hour}:${p.minute}`;
  const dow = new Date(`${ymd}T00:00:00Z`).getUTCDay();
  return { ymd, hhmm, dow };
}

/** Convert a clinic wall-clock date + time ("YYYY-MM-DD", h, m) to a UTC instant. */
export function zonedToUtc(ymd: string, h: number, m: number, tz: string): Date {
  const guess = Date.UTC(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10), h, m, 0);
  let t = guess;
  for (let i = 0; i < 2; i++) {
    const p = parts(new Date(t), tz);
    const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    t -= asUtc - guess;
  }
  return new Date(t);
}

/** [start, end) UTC instants of a clinic-local calendar day. */
export function dayRange(ymd: string, tz: string): { start: Date; end: Date } {
  const start = zonedToUtc(ymd, 0, 0, tz);
  const next = new Date(Date.UTC(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10) + 1)).toISOString().slice(0, 10);
  return { start, end: zonedToUtc(next, 0, 0, tz) };
}
