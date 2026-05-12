import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { 
  Clock, User, Scissors, Heart, 
  CheckCircle, ChevronRight, Phone, Mail, 
  History, Calendar, Search, AlertCircle, ArrowRight, XCircle
} from 'lucide-react';
import { format, getDay, parseISO, isWithinInterval } from 'date-fns';

export function PublicBookingPage() {
  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [success, setSuccess] = useState(false);
  const [patientData, setPatientData] = useState<any>(null);
  const [busyTimes, setBusyTimes] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    doctorId: '',
    serviceId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '10:00',
    notes: '',
  });

  useEffect(() => {
    axios.get('/api/public/doctors').then(res => setDoctors(res.data.data));
    axios.get('/api/public/services').then(res => setServices(res.data.data));
    axios.get('/api/public/settings').then(res => setSettings(res.data.data));
  }, []);

  // Fetch busy times when doctor or date changes
  useEffect(() => {
    if (formData.doctorId && formData.date) {
      axios.get(`/api/public/doctor-busy-times?doctorId=${formData.doctorId}&date=${formData.date}`)
        .then(res => setBusyTimes(res.data.data));
    }
  }, [formData.doctorId, formData.date]);

  const checkPatient = async () => {
    if (!formData.phone || formData.phone.length < 8) return;
    setSearching(true);
    try {
      const res = await axios.get(`/api/public/check-patient?phone=${formData.phone}`);
      const data = res.data.data;
      if (data && !data.isNew) {
        setPatientData(data);
        setFormData(prev => ({
          ...prev,
          fullName: data.fullName,
          email: data.email || ''
        }));
      } else {
        setPatientData({ isNew: true });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const selectedDate = new Date(formData.date);
  const dayOfWeek = getDay(selectedDate);
  const selectedDoctor = doctors.find(d => String(d.id) === formData.doctorId);
  const selectedService = services.find(s => String(s.id) === formData.serviceId);

  // Filter logic for doctors
  const filteredDoctors = doctors.filter(doc => {
    if (selectedService && doc.specialtyId !== selectedService.specialtyId) return false;
    if (doc.schedules && doc.schedules.length > 0) {
      return doc.schedules.some((s: any) => s.dayOfWeek === dayOfWeek);
    }
    return true;
  });

  // Check if chosen time is within doctor's schedule and not busy
  const isTimeAvailable = () => {
    if (!selectedDoctor || !formData.time || !formData.date) return false;
    
    // 1. Check Schedule
    const schedule = selectedDoctor.schedules?.find((s: any) => s.dayOfWeek === dayOfWeek);
    if (!schedule) return false;
    if (formData.time < schedule.startTime || formData.time > schedule.endTime) return false;

    // 2. Check Conflicts
    const start = new Date(`${formData.date}T${formData.time}`);
    const duration = selectedService?.durationMin || 30;
    const end = new Date(start.getTime() + duration * 60000);

    const isBusy = busyTimes.some(b => {
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return (start < bEnd && end > bStart);
    });

    return !isBusy;
  };

  const handleBook = async () => {
    setLoading(true);
    try {
      const startTime = new Date(`${formData.date}T${formData.time}`);
      await axios.post('/api/public/book', {
        ...formData,
        doctorId: Number(formData.doctorId),
        serviceId: Number(formData.serviceId),
        startTime: startTime.toISOString(),
      });
      setSuccess(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error booking appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-4">Booked!</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Your appointment request has been received. We will contact you shortly at 
            <span className="font-bold text-brand-600 block mt-1">{formData.phone}</span> 
            to confirm your visit.
          </p>
          <Button 
            className="w-full py-4 rounded-xl text-lg shadow-lg shadow-brand-500/20"
            onClick={() => window.location.reload()}
          >
            Go Back Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header - Now dynamic based on settings */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
            {settings.clinic_name || 'Clinic Portal'}
          </h1>
          <p className="text-gray-500 text-lg">
            {settings.clinic_slogan || 'Smart & Seamless Medical Booking'}
          </p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[650px] border border-gray-100">
          {/* Left Sidebar Info */}
          <div className="md:w-1/3 bg-brand-600 p-10 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
            <div className="relative z-10">
              <h3 className="text-2xl font-black mb-10 tracking-tight">Booking Flow</h3>
              <div className="space-y-10">
                {[
                  { n: 1, label: 'Identify Yourself', sub: 'Phone & Name', icon: User },
                  { n: 2, label: 'Medical History', sub: 'Past visits', icon: History },
                  { n: 3, label: 'Choose Service', sub: 'Specialty & Treatment', icon: Scissors },
                  { n: 4, label: 'Pick Time', sub: 'Date & Slot', icon: Clock }
                ].map((s) => (
                  <div key={s.n} className={`flex items-start gap-4 transition-all duration-500 ${step === s.n ? 'opacity-100 scale-105' : 'opacity-40'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${step === s.n ? 'bg-white text-brand-600 shadow-xl' : 'bg-brand-500 text-white'}`}>
                      {s.n}
                    </div>
                    <div>
                      <p className="font-bold text-white tracking-wide">{s.label}</p>
                      <p className="text-[10px] text-brand-100 uppercase tracking-widest">{s.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Form Area */}
          <div className="flex-1 p-10 md:p-14 bg-white">
            
            {/* STEP 1: Phone & Check */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right duration-500 space-y-8">
                <div className="space-y-2">
                  <span className="text-brand-600 font-bold text-xs uppercase tracking-widest">Step 01</span>
                  <h2 className="text-3xl font-black text-gray-900">Welcome Back?</h2>
                  <p className="text-gray-500">Enter your phone number to check your account</p>
                </div>

                <div className="space-y-6">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="w-5 h-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                    </div>
                    <input 
                      type="tel" 
                      placeholder="01xxxxxxxxx"
                      className="w-full pl-12 pr-24 py-5 bg-gray-50 border border-gray-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:bg-white transition-all text-xl font-bold"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                    <button 
                      onClick={checkPatient}
                      disabled={searching || formData.phone.length < 8}
                      className="absolute right-2 top-2 bottom-2 px-6 bg-brand-600 text-white rounded-2xl font-bold text-sm hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-500/20"
                    >
                      {searching ? 'Checking...' : 'Verify'}
                    </button>
                  </div>

                  {patientData && (
                    <div className="animate-in zoom-in-95 duration-300 p-6 rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50">
                      {patientData.isNew ? (
                        <div className="flex items-center gap-4 text-gray-600">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                            <User className="w-6 h-6 text-brand-500" />
                          </div>
                          <div>
                            <p className="font-bold">New Patient Account</p>
                            <p className="text-xs">It looks like this is your first time here!</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 text-gray-900">
                          <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center shadow-xl shadow-brand-500/20">
                            <CheckCircle className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="font-black text-lg">Found you, {patientData.fullName}!</p>
                            <p className="text-xs text-gray-500">We've loaded your profile data.</p>
                          </div>
                        </div>
                      )}

                      <div className="mt-6 space-y-4">
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input 
                            type="text" placeholder="Your Full Name"
                            className="w-full pl-11 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none shadow-sm font-bold"
                            value={formData.fullName}
                            onChange={e => setFormData({...formData, fullName: e.target.value})}
                          />
                        </div>
                      </div>

                      <Button 
                        className="w-full mt-6 py-4 rounded-2xl text-lg gap-2"
                        disabled={!formData.fullName}
                        onClick={() => setStep(patientData.isNew ? 3 : 2)}
                      >
                        {patientData.isNew ? 'Start Booking' : 'View My History'}
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: History */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right duration-500 space-y-8">
                <div className="space-y-2">
                  <span className="text-brand-600 font-bold text-xs uppercase tracking-widest">Step 02</span>
                  <h2 className="text-3xl font-black text-gray-900">Your History</h2>
                  <p className="text-gray-500">Overview of your previous visits with us</p>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {patientData?.appointments?.length > 0 ? (
                    patientData.appointments.map((apt: any) => (
                      <div key={apt.id} className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-between group hover:border-brand-200 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-50 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                            <span>{format(new Date(apt.startTime), 'MMM')}</span>
                            <span className="text-sm leading-none">{format(new Date(apt.startTime), 'dd')}</span>
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{apt.service.name}</p>
                            <p className="text-xs text-gray-500">Dr. {apt.doctor?.user?.fullName || apt.doctor?.fullName}</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                          apt.status === 'Confirmed' ? 'bg-green-100 text-green-600' : 
                          apt.status === 'Cancelled' ? 'bg-red-100 text-red-600' :
                          'bg-brand-100 text-brand-600'
                        }`}>
                          {apt.status === 'Confirmed' ? <CheckCircle className="w-3 h-3" /> : 
                           apt.status === 'Cancelled' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {apt.status}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                      <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">No previous visits found.</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" className="flex-1 py-4 rounded-2xl" onClick={() => setStep(1)}>Back</Button>
                  <Button className="flex-[2] py-4 rounded-2xl text-lg shadow-xl shadow-brand-500/20 gap-2" onClick={() => setStep(3)}>
                    Book New Appointment
                    <PlusIcon className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3 & 4 (Simplified) */}
            {step >= 3 && (
              <div className="animate-in fade-in slide-in-from-right duration-500 space-y-8">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-gray-900">New Booking</h2>
                  <p className="text-gray-500">Select service, doctor and time</p>
                </div>

                <div className="space-y-4">
                  <select 
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none"
                    value={formData.serviceId}
                    onChange={e => setFormData({...formData, serviceId: e.target.value, doctorId: ''})}
                  >
                    <option value="">Choose Service</option>
                    {services.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.price} EGP)</option>)}
                  </select>

                  <input 
                    type="date"
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value, doctorId: ''})}
                  />

                  <div className="grid grid-cols-1 gap-2">
                    <label className="text-xs font-bold text-gray-400 ml-1">Available Doctors</label>
                    {filteredDoctors.length > 0 ? (
                      filteredDoctors.map((d: any) => {
                        const sched = d.schedules?.find((s: any) => s.dayOfWeek === dayOfWeek);
                        return (
                          <button 
                            key={d.id}
                            onClick={() => setFormData({...formData, doctorId: String(d.id)})}
                            className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                              formData.doctorId === String(d.id) ? 'border-brand-600 bg-brand-50' : 'border-gray-50 bg-white'
                            }`}
                          >
                            <div>
                              <p className="text-sm font-bold">Dr. {d.user?.fullName || d.fullName}</p>
                              {sched && <p className="text-[10px] text-gray-500">Hours: {sched.startTime} - {sched.endTime}</p>}
                            </div>
                            {formData.doctorId === String(d.id) && <CheckCircle className="w-4 h-4 text-brand-600" />}
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-xs text-red-500 p-2">No doctors available on this day.</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 ml-1">Select Time</label>
                    <input 
                      type="time"
                      className={`w-full px-6 py-4 border rounded-2xl focus:outline-none ${
                        formData.doctorId && !isTimeAvailable() ? 'border-red-300 bg-red-50' : 'bg-gray-50 border-gray-100'
                      }`}
                      value={formData.time}
                      onChange={e => setFormData({...formData, time: e.target.value})}
                    />
                    {formData.doctorId && !isTimeAvailable() && (
                      <p className="text-[10px] text-red-500 font-bold ml-2">Time is unavailable or outside working hours.</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" className="flex-1 py-4 rounded-2xl" onClick={() => setStep(patientData?.isNew ? 1 : 2)}>Back</Button>
                  <Button 
                    className="flex-[2] py-4 rounded-2xl text-lg shadow-xl shadow-brand-500/20"
                    loading={loading}
                    disabled={!formData.doctorId || !isTimeAvailable()}
                    onClick={handleBook}
                  >
                    Confirm Booking
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 text-sm">
            Designed and developed by{' '}
            <a 
              href="https://www.facebook.com/itqansolutions" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-brand-600 font-black hover:underline transition-all"
            >
              Itqan Solutions
            </a>
            {' '}© {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  );
}
