/**
 * Automated Postgres backups.
 * Daily pg_dump (custom format, compressed) into BACKUP_DIR (default /data/backups).
 * Mount a Railway volume at /data so backups survive redeploys.
 * Keeps the newest BACKUP_RETENTION files (default 14). Runs under an advisory lock so
 * only one instance dumps. Restore: pg_restore --clean --no-owner -d "$DATABASE_URL" FILE
 */
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { rawPrisma as prisma } from '../config/db';

const DIR = process.env.BACKUP_DIR || '/data/backups';
const KEEP = parseInt(process.env.BACKUP_RETENTION || '14', 10);

export function listBackups() {
  if (!fs.existsSync(DIR)) return [];
  return fs.readdirSync(DIR).filter((f) => f.endsWith('.dump')).sort().reverse().map((f) => {
    const st = fs.statSync(path.join(DIR, f));
    return { file: f, bytes: st.size, modified: st.mtime.toISOString() };
  });
}

export async function runBackup(): Promise<{ file: string; bytes: number }> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  fs.mkdirSync(DIR, { recursive: true });
  const name = `clinic-${new Date().toISOString().replace(/[:.]/g, '-')}.dump`;
  const tmp = path.join(DIR, name + '.part');
  const final = path.join(DIR, name);
  await new Promise<void>((resolve, reject) => {
    const p = spawn('pg_dump', ['--format=custom', '--compress=6', '--no-owner', '--file', tmp, url]);
    let err = '';
    p.stderr.on('data', (d) => (err += d));
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`pg_dump exit ${code}: ${err.slice(0, 300)}`))));
  });
  fs.renameSync(tmp, final);
  const all = listBackups();
  for (const old of all.slice(KEEP)) fs.unlinkSync(path.join(DIR, old.file));
  return { file: name, bytes: fs.statSync(final).size };
}

async function locked() {
  const rows: any[] = await (prisma as any).$queryRaw`SELECT pg_try_advisory_lock(727301) AS ok`;
  if (!rows[0]?.ok) return;
  try {
    const r = await runBackup();
    console.info(`[Backup] ${r.file} (${r.bytes} bytes)`);
  } finally {
    await (prisma as any).$queryRaw`SELECT pg_advisory_unlock(727301)`;
  }
}

export function startBackupWorker(): void {
  // 03:00 server time (UTC) = 05:00 Cairo, low traffic.
  cron.schedule('0 3 * * *', async () => {
    try { await locked(); } catch (e) { console.error('[Backup] failed:', e); }
  });
  console.info(`[Backup] daily 03:00 UTC to ${DIR}, keep ${KEEP}`);
}
