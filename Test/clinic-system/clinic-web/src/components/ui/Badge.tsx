import { clsx } from 'clsx';
import type { AppointmentStatus } from '@/types';

type BadgeVariant = 'gray' | 'blue' | 'green' | 'red' | 'yellow' | 'purple';

const VARIANTS: Record<BadgeVariant, string> = {
  gray:   'bg-gray-100 text-gray-700',
  blue:   'bg-blue-50 text-blue-700',
  green:  'bg-green-50 text-green-700',
  red:    'bg-red-50 text-red-700',
  yellow: 'bg-yellow-50 text-yellow-700',
  purple: 'bg-purple-50 text-purple-700',
};

export function Badge({
  children,
  variant = 'gray',
  dot = false,
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium',
        VARIANTS[variant],
        className
      )}
    >
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full',
            {
              'bg-gray-500':   variant === 'gray',
              'bg-blue-500':   variant === 'blue',
              'bg-green-500':  variant === 'green',
              'bg-red-500':    variant === 'red',
              'bg-yellow-500': variant === 'yellow',
              'bg-purple-500': variant === 'purple',
            }
          )}
        />
      )}
      {children}
    </span>
  );
}

// Convenience: appointment status badge
const STATUS_MAP: Record<AppointmentStatus, { variant: BadgeVariant; label: string }> = {
  Pending:   { variant: 'yellow', label: 'Pending' },
  Confirmed: { variant: 'blue',   label: 'Confirmed' },
  Done:      { variant: 'green',  label: 'Done' },
  Cancelled: { variant: 'red',    label: 'Cancelled' },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { variant, label } = STATUS_MAP[status];
  return <Badge variant={variant} dot>{label}</Badge>;
}
