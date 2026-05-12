import { useState } from 'react';
import { useAppointments } from '@/hooks/useAppointments';
import { PageLoader } from '@/components/ui/Loader';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, Clock, User, Scissors, LayoutGrid, List, Calendar as CalendarIcon, Phone } from 'lucide-react';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { formatDateTime } from '@/utils/format';
import { AppointmentDetailsModal } from '@/components/appointments/AppointmentDetailsModal';

export function CalendarPage() {
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const { data, isLoading } = useAppointments({
    start: startOfMonth(currentDate).toISOString(),
    end: endOfMonth(currentDate).toISOString(),
  });

  const renderHeader = () => {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center gap-1 mt-1">
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-3 text-[10px] font-bold uppercase tracking-wider" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('month')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
              viewMode === 'month' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
              viewMode === 'list' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List className="w-4 h-4" />
            List
          </button>
        </div>
      </div>
    );
  };

  const renderListView = () => {
    const appointments = data?.data || [];
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date & Time</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Doctor</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Service</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {appointments.map((apt: any) => (
              <tr key={apt.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand-500" />
                    <span className="text-sm font-bold text-gray-700">{formatDateTime(apt.startTime)}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{apt.patient?.fullName}</p>
                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {apt.patient?.phone}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Dr. {apt.doctor?.user?.fullName}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{apt.service?.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedAppointment(apt)}>View</Button>
                </td>
              </tr>
            ))}
            {appointments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">No appointments for this month.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-2 px-1">
        {days.map((day) => (
          <div key={day} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, 'd');
        const cloneDay = day;
        
        const dayAppointments = data?.data?.filter((apt: any) => 
          isSameDay(new Date(apt.startTime), cloneDay)
        ) || [];

        days.push(
          <div
            key={day.toString()}
            className={`min-h-[130px] p-2 border border-gray-100 transition-all ${
              !isSameMonth(day, monthStart) ? 'bg-gray-50/50 opacity-40' : 
              isSameDay(day, new Date()) ? 'bg-brand-50/20' : 'bg-white'
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg ${
                isSameDay(day, new Date()) ? 'bg-brand-600 text-white shadow-md shadow-brand-200' : 'text-gray-700'
              }`}>
                {formattedDate}
              </span>
            </div>
            <div className="space-y-1 overflow-y-auto max-h-[85px] custom-scrollbar pr-1">
              {dayAppointments.map((apt: any) => (
                <div 
                  key={apt.id} 
                  onClick={() => setSelectedAppointment(apt)}
                  className="text-[9px] p-2 rounded-xl bg-white border border-gray-100 shadow-sm truncate hover:border-brand-300 hover:shadow-md cursor-pointer transition-all border-l-4 border-l-brand-500"
                >
                  <p className="font-bold text-gray-800 leading-tight">{apt.patient?.fullName}</p>
                  <p className="text-brand-600 mt-0.5 font-semibold">{format(new Date(apt.startTime), 'hh:mm a')}</p>
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">{rows}</div>;
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-12">
      {renderHeader()}
      
      {isLoading ? (
        <div className="h-[600px] flex items-center justify-center bg-white rounded-2xl border border-gray-100">
          <PageLoader />
        </div>
      ) : (
        <>
          {viewMode === 'month' ? (
            <>
              {renderDays()}
              {renderCells()}
            </>
          ) : (
            renderListView()
          )}
        </>
      )}

      <AppointmentDetailsModal 
        isOpen={!!selectedAppointment}
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
      />
    </div>
  );
}
