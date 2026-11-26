import { format, formatDistanceToNow, parseISO } from 'date-fns';

// ── Date ──────────────────────────────────────────────────────────────────

export const isArabic = (): boolean =>
  typeof localStorage !== 'undefined' && localStorage.getItem('lang') === 'ar';

const AR_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const pad = (n: number) => String(n).padStart(2, '0');

// Same patterns as date-fns, but Arabic month names and ص/م in the Arabic UI (Western digits, like the rest of the app).
export function fmt(d: Date, pattern: string): string {
  if (!isArabic()) return format(d, pattern);
  const h12 = d.getHours() % 12 || 12;
  const map: Record<string, string> = {
    yyyy: String(d.getFullYear()), MMMM: AR_MONTHS[d.getMonth()], MMM: AR_MONTHS[d.getMonth()],
    dd: pad(d.getDate()), d: String(d.getDate()), HH: pad(d.getHours()), hh: pad(h12), h: String(h12),
    mm: pad(d.getMinutes()), a: d.getHours() < 12 ? 'ص' : 'م',
  };
  return pattern.replace(/yyyy|MMMM|MMM|dd|HH|hh|mm|d|h|a/g, (t) => map[t]);
}

export function formatDate(date: string | Date, pattern = 'dd MMM yyyy'): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return fmt(d, pattern);
  } catch (e) {
    return '—';
  }
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isArabic() ? fmt(d, 'dd MMM yyyy، hh:mm a') : format(d, 'dd MMM yyyy, hh:mm a');
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return fmt(d, 'hh:mm a');
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

// ── Currency ──────────────────────────────────────────────────────────────

export function formatCurrency(
  amount: number,
  _currency = 'EGP',
  symbol = 'ج.م'
): string {
  const val = typeof amount === 'number' ? amount : Number(amount || 0);
  return `${symbol} ${val.toLocaleString('en-EG', { minimumFractionDigits: 0 })}`;
}

// ── Patient code ──────────────────────────────────────────────────────────

export function formatPatientCode(code: string): string {
  return code.toUpperCase();
}

// ── Initials ──────────────────────────────────────────────────────────────

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase();
}
