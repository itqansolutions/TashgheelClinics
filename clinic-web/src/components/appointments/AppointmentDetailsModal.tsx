import { X, Clock, User, Scissors, Phone, FileText, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDateTime, formatCurrency } from '@/utils/format';

import { useUpdateAppointment } from '@/hooks/useAppointments';

interface Props {
  appointment: any;
  isOpen: boolean;
  onClose: () => void;
}

export function AppointmentDetailsModal({ appointment, isOpen, onClose }: Props) {
  const updateMutation = useUpdateAppointment();
  if (!isOpen || !appointment) return null;

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await updateMutation.mutateAsync({ 
        id: appointment.id, 
        data: { status: newStatus } 
      });
      onClose(); // Close modal on success
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              appointment.status === 'Confirmed' ? 'bg-green-100 text-green-600' :
              appointment.status === 'Cancelled' ? 'bg-red-100 text-red-600' :
              'bg-brand-100 text-brand-600'
            }`}>
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Appointment Details</h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                appointment.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                appointment.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                'bg-brand-100 text-brand-700'
              }`}>
                {appointment.status}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Patient Card */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-brand-600 font-bold border border-gray-200">
              {appointment.patient?.fullName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 truncate">{appointment.patient?.fullName}</h3>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Phone className="w-3 h-3" />
                {appointment.patient?.phone}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Patient Code</p>
              <p className="text-sm font-bold text-brand-600">{appointment.patient?.code}</p>
            </div>
          </div>

          {/* Grid Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Date & Time</p>
                  <p className="text-sm font-bold text-gray-800">{formatDateTime(appointment.startTime)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Doctor</p>
                  <p className="text-sm font-bold text-gray-800">Dr. {appointment.doctor?.user?.fullName || appointment.doctor?.fullName}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Scissors className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Service</p>
                  <p className="text-sm font-bold text-gray-800">{appointment.service?.name}</p>
                  <p className="text-xs text-brand-600 font-bold">{formatCurrency(appointment.priceCharged || 0)}</p>
                </div>
              </div>
              {appointment.notes && (
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Notes</p>
                    <p className="text-xs text-gray-600 leading-relaxed italic">"{appointment.notes}"</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex gap-3">
          {appointment.status === 'Pending' ? (
            <>
              <Button 
                variant="outline" 
                className="flex-1 gap-2 text-red-600 border-red-200 hover:bg-red-50"
                loading={updateMutation.isPending}
                onClick={() => handleStatusUpdate('Cancelled')}
              >
                <XCircle className="w-4 h-4" />
                Reject
              </Button>
              <Button 
                className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                loading={updateMutation.isPending}
                onClick={() => handleStatusUpdate('Confirmed')}
              >
                <CheckCircle className="w-4 h-4" />
                Accept
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                className="flex-1 gap-2"
                disabled={appointment.status === 'Cancelled'}
                onClick={() => handleStatusUpdate('Cancelled')}
              >
                <XCircle className="w-4 h-4" />
                Cancel Appointment
              </Button>
              <Button 
                className="flex-1 gap-2"
                disabled={appointment.status === 'Done' || appointment.status === 'Cancelled'}
                onClick={() => handleStatusUpdate('Done')}
              >
                <CheckCircle className="w-4 h-4" />
                Mark as Done
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
