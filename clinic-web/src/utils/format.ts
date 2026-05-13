import { format, formatDistanceToNow, parseISO } from 'date-fns';

// ── Date ──────────────────────────────────────────────────────────────────

export function formatDate(date: string | Date, pattern = 'dd MMM yyyy'): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, pattern);
  } catch (e) {
    return '—';
  }
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy, hh:mm a');
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'hh:mm a');
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
