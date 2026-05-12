import { useState, useEffect } from 'react';
import api from '@/api/client';
import { PageLoader } from '@/components/ui/Loader';
import { Button } from '@/components/ui/Button';
import { 
  Calendar, Clock, User, 
  Plus, Trash2, Save
} from 'lucide-react';

const DAYS = [
  { id: 0, name: 'Sunday' },
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' },
];

export function DoctorSchedulePage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Initial fetch for doctors list
    api.get('/doctors').then(res => {
      setDoctors(res.data.data);
      setLoading(false);
    });
  }, []);

  const fetchSchedule = (docId: string) => {
    if (!docId) return;
    setLoading(true);
    api.get(`/doctors/${docId}/schedule`).then(res => {
      setSchedules(res.data.data);
      setLoading(false);
    }).catch(() => {
      // If endpoint doesn't exist yet, we'll just show empty
      setSchedules([]);
      setLoading(false);
    });
  };

  const addTimeSlot = (dayId: number) => {
    setSchedules([...schedules, { dayOfWeek: dayId, startTime: '09:00', endTime: '17:00' }]);
  };

  const removeSlot = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: string, value: any) => {
    const newSchedules = [...schedules];
    newSchedules[index][field] = value;
    setSchedules(newSchedules);
  };

  const handleSave = async () => {
    if (!selectedDoctorId) return;
    setSaving(true);
    try {
      await api.put(`/doctors/${selectedDoctorId}/schedule`, { schedules });
      alert('Schedule saved successfully!');
    } catch (err) {
      alert('Failed to save schedule.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Doctor's Schedule</h1>
          <p className="text-gray-500">Manage weekly working hours and availability</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          <User className="w-5 h-5 text-gray-400 ml-2" />
          <select 
            className="bg-transparent border-none outline-none font-bold text-gray-800 pr-8"
            value={selectedDoctorId}
            onChange={(e) => {
              setSelectedDoctorId(e.target.value);
              fetchSchedule(e.target.value);
            }}
          >
            <option value="">Select a Doctor</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>Dr. {d.user?.fullName || d.fullName}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedDoctorId ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200 flex flex-col items-center">
          <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mb-6">
            <Calendar className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Doctor Selected</h3>
          <p className="text-gray-400 max-w-sm">Please select a doctor from the list above to view or manage their weekly schedule.</p>
        </div>
      ) : loading ? (
        <PageLoader />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {DAYS.map(day => {
              const daySlots = schedules.filter(s => s.dayOfWeek === day.id);
              return (
                <div key={day.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${daySlots.length > 0 ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {day.name.charAt(0)}
                      </div>
                      <h4 className="font-bold text-gray-900">{day.name}</h4>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs gap-2"
                      onClick={() => addTimeSlot(day.id)}
                    >
                      <Plus className="w-3 h-3" /> Add Slot
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {daySlots.map((slot) => {
                      const globalIndex = schedules.indexOf(slot);
                      return (
                        <div key={globalIndex} className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl animate-in fade-in slide-in-from-left duration-200">
                          <div className="flex items-center gap-2 flex-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <input 
                              type="time" 
                              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/20"
                              value={slot.startTime}
                              onChange={(e) => updateSlot(globalIndex, 'startTime', e.target.value)}
                            />
                            <span className="text-gray-400 mx-1">to</span>
                            <input 
                              type="time" 
                              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/20"
                              value={slot.endTime}
                              onChange={(e) => updateSlot(globalIndex, 'endTime', e.target.value)}
                            />
                          </div>
                          <button 
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            onClick={() => removeSlot(globalIndex)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                    {daySlots.length === 0 && (
                      <div className="text-center py-4 text-gray-400 text-sm italic">
                        No working hours set for this day.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              className="px-12 py-4 h-auto text-lg rounded-2xl shadow-xl shadow-brand-500/20 gap-3"
              loading={saving}
              onClick={handleSave}
            >
              <Save className="w-5 h-5" />
              Save Schedule
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
