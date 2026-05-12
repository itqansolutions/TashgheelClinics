import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

// ── Full-page loader ──────────────────────────────────────────────────────
export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
    </div>
  );
}

// ── Inline spinner ────────────────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2 className={clsx('animate-spin text-brand-500', className)} />
  );
}

// ── Skeleton block ────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx('animate-pulse bg-gray-200 rounded-lg', className)}
    />
  );
}

// ── KPI card skeleton ─────────────────────────────────────────────────────
export function KpiSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-7 w-20 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}
