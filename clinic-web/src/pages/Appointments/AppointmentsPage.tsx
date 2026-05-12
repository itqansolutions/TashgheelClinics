import { useState } from 'react';
import { useAppointments, useDoctorAppointments } from '@/hooks/useAppointments';
import { useRole } from '@/store/authStore';
import { PageLoader } from '@/components/ui/Loader';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { Calendar, Filter, Plus, Search, Clock, User, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CreateAppointmentModal } from '@/components/appointments/CreateAppointmentModal';
import { AppointmentDetailsModal } from '@/components/appointments/AppointmentDetailsModal';

export function AppointmentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState<any>(null);
  const role = useRole();
  const filters = {};
  
  const allAppts = useAppointments(filters);
  const doctorAppts = useDoctorAppointments(filters);
  
  const { data, isLoading } = role === 'Doctor' ? doctorAppts : allAppts;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500">Manage and schedule patient visits</p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          New Appointment
        </Button>
      </div>

      <CreateAppointmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      <AppointmentDetailsModal
        appointment={selectedApt}
        isOpen={!!selectedApt}
        onClose={() => setSelectedApt(null)}
      />

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search appointments..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Today
          </Button>
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.map((apt: any) => (
            <div key={apt.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold">
                    {apt.patient?.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{apt.patient?.fullName}</h3>
                    <p className="text-xs text-gray-500">{apt.patient?.code}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                  apt.status === 'Confirmed' ? 'bg-green-50 text-green-600' :
                  apt.status === 'Pending' ? 'bg-yellow-50 text-yellow-600' :
                  'bg-gray-50 text-gray-600'
                }`}>
                  {apt.status}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {formatDateTime(apt.startTime)}
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  Dr. {apt.doctor?.user?.fullName || apt.doctor?.fullName}
                </div>
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-gray-400" />
                  {apt.service?.name}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                <span className="font-bold text-brand-600">
                  {formatCurrency(apt.priceCharged || apt.service?.price || 0)}
                </span>
                <div className="flex gap-2">
                  {role === 'Doctor' && apt.status !== 'Done' && (
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={() => window.location.href = `/appointments/${apt.id}/consultation`}
                    >
                      Start Consultation
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setSelectedApt(apt)}>Details</Button>
                </div>
              </div>
            </div>
          ))}
          {data?.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500">
              No appointments found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
