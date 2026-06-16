import { CalendarDays, Clock, User } from 'lucide-react';
import { usePatientAppointments } from '@/hooks/usePatients';
import { StatusBadge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDateTime, formatCurrency } from '@/utils/format';
import type { Appointment } from '@/types';

export function AppointmentsTab({ patientId }: { patientId: number }) {
  const { data: appointments, isLoading } = usePatientAppointments(patientId);

  if (isLoading) return <div className="p-5"><PageLoader /></div>;

  if (!appointments?.length) {
    return (
      <div className="p-5">
        <EmptyState
          icon={CalendarDays}
          title="No appointments yet"
          description="This patient hasn't had any appointments."
        />
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-50">
      <div className="px-5 py-3 bg-gray-50/50">
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
          Appointment History ({appointments.length})
        </h3>
      </div>

      {(appointments as Appointment[]).map((appt) => (
        <div key={appt.id} className="px-5 py-4 hover:bg-gray-50/40 transition-colors">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Service name */}
              <p className="text-sm font-medium text-gray-900 truncate">
                {appt.service?.name ?? '—'}
              </p>

              {/* Doctor */}
              {appt.doctor && (
                <div className="flex items-center gap-1 mt-0.5">
                  <User className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {appt.doctor.user?.fullName || appt.doctor.fullName}
                  </span>
                </div>
              )}

              {/* Date & time */}
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <CalendarDays className="w-3 h-3 text-gray-400" />
                  {formatDateTime(appt.startTime)}
                </div>
                {appt.service?.durationMin && (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {appt.service.durationMin} min
                  </div>
                )}
              </div>
            </div>

            {/* Right side */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <StatusBadge status={appt.status} />
              {appt.priceCharged != null && (
                <span className="text-xs font-medium text-gray-700">
                  {formatCurrency(appt.priceCharged)}
                </span>
              )}
              {appt.discountPct > 0 && (
                <span className="text-[11px] text-green-600">
                  -{appt.discountPct}% discount
                </span>
              )}
            </div>
          </div>

          {appt.notes && (
            <p className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 line-clamp-2">
              {appt.notes}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
