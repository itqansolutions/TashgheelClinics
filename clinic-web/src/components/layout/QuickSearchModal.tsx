import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, X, User, Stethoscope, Package, Truck, 
  Calendar, ArrowRight, CornerDownLeft, Sparkles 
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { patientsApi, doctorsApi } from '@/api/index';
import { stockApi } from '@/api/stock';
import { appointmentsApi } from '@/api/appointments';
import { formatCurrency, formatDateTime } from '@/utils/format';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickSearchModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 200);
  const [loading, setLoading] = useState(false);
  
  // Results states
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
    }
  }, [isOpen]);

  // Bind Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch search results
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setPatients([]);
      setDoctors([]);
      setProducts([]);
      setVendors([]);
      setAppointments([]);
      setLoading(false);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      const searchVal = debouncedQuery.toLowerCase();
      try {
        const [patientsRes, doctorsRes, productsRes, vendorsRes, appointmentsRes] = await Promise.all([
          // Patients search
          patientsApi.list({ search: debouncedQuery, limit: 5 }).catch(() => ({ data: { data: [] } })),
          // Doctors search
          doctorsApi.list({ search: debouncedQuery, limit: 5 }).catch(() => ({ data: { data: [] } })),
          // Products search (local filter)
          stockApi.getProducts().catch(() => ({ data: [] })),
          // Vendors search (local filter)
          stockApi.getVendors().catch(() => ({ data: [] })),
          // Appointments search (fetch recent and local filter)
          appointmentsApi.getAll({ limit: 100 }).catch(() => ({ data: [] }))
        ]);

        // 1. Process Patients
        setPatients(patientsRes.data.data || []);

        // 2. Process Doctors
        setDoctors(doctorsRes.data.data || []);

        // 3. Process Products
        const matchedProducts = (productsRes.data || [])
          .filter((p: any) => 
            p.name.toLowerCase().includes(searchVal) || 
            (p.sku && p.sku.toLowerCase().includes(searchVal)) ||
            (p.category && p.category.toLowerCase().includes(searchVal))
          )
          .slice(0, 5);
        setProducts(matchedProducts);

        // 4. Process Vendors
        const matchedVendors = (vendorsRes.data || [])
          .filter((v: any) => 
            v.name.toLowerCase().includes(searchVal) || 
            (v.contactName && v.contactName.toLowerCase().includes(searchVal))
          )
          .slice(0, 5);
        setVendors(matchedVendors);

        // 5. Process Appointments
        const matchedAppts = (appointmentsRes.data || [])
          .filter((a: any) => {
            const patientName = a.patient?.fullName?.toLowerCase() || '';
            const doctorName = a.doctor?.user?.fullName?.toLowerCase() || a.doctor?.fullName?.toLowerCase() || '';
            const serviceName = a.service?.name?.toLowerCase() || '';
            return patientName.includes(searchVal) || doctorName.includes(searchVal) || serviceName.includes(searchVal);
          })
          .slice(0, 5);
        setAppointments(matchedAppts);

      } catch (err) {
        console.error("Quick Search Error: ", err);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  if (!isOpen) return null;

  const hasResults = patients.length > 0 || doctors.length > 0 || products.length > 0 || vendors.length > 0 || appointments.length > 0;

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const shortcuts = [
    { label: 'Register New Patient', path: '/patients/new', color: 'bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100/70', icon: User },
    { label: 'View Calendar', path: '/calendar', color: 'bg-teal-50 border-teal-100 text-teal-700 hover:bg-teal-100/70', icon: Calendar },
    { label: 'View Financial Ledger', path: '/finance', color: 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100/70', icon: Sparkles },
    { label: 'Manage Stock Balance', path: '/stock/balance', color: 'bg-purple-50 border-purple-100 text-purple-700 hover:bg-purple-100/70', icon: Package }
  ];

  return (
    <div 
      className="fixed inset-0 z-[150] bg-gray-950/60 backdrop-blur-md flex items-start justify-center pt-[10vh] px-4 overflow-y-auto pb-10"
      onClick={onClose}
    >
      <div 
        className="bg-white border border-gray-100 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl scale-100 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="relative border-b border-gray-100 p-4 flex items-center bg-gray-50/50">
          <Search className="absolute left-7 w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search patients, doctors, appointments, stock..."
            className="w-full pl-12 pr-10 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-gray-800 shadow-sm placeholder-gray-400"
          />
          {loading ? (
            <div className="absolute right-14 w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          ) : query ? (
            <button onClick={() => setQuery('')} className="absolute right-14 p-1 hover:bg-gray-200 rounded-full transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          ) : (
            <div className="absolute right-14 flex items-center gap-1 text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 border border-gray-200 rounded-lg">
              <span>ESC</span>
            </div>
          )}
          <button onClick={onClose} className="ml-3 p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {/* Shortcuts / Quick Access when empty query */}
          {!query && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {shortcuts.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleNavigate(s.path)}
                      className={`flex items-center gap-3 p-4 border rounded-2xl text-left text-xs font-bold transition-all hover:translate-y-[-2px] hover:shadow-md ${s.color}`}
                    >
                      <div className="p-2 rounded-xl bg-white shadow-sm">
                        <s.icon className="w-4 h-4" />
                      </div>
                      <span className="flex-1">{s.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-brand-50/40 border border-brand-100/50 p-4 flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-brand-900 uppercase tracking-tight">Smart Command Search</h4>
                  <p className="text-[11px] text-brand-700 mt-1 leading-relaxed">
                    Search instantly across all records. Just type a name, code, SKU, phone number, specialty, or service name to view matching items and open details.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Searching and Results */}
          {query && !loading && !hasResults && (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-3">
                <Search className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-gray-800">No results found</p>
              <p className="text-xs text-gray-400 mt-1">We couldn't find anything matching "{query}"</p>
            </div>
          )}

          {query && hasResults && (
            <div className="space-y-6">
              {/* Category: Patients */}
              {patients.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5">
                    <User className="w-3 h-3" /> Patients ({patients.length})
                  </h4>
                  <div className="space-y-1">
                    {patients.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleNavigate(`/patients/${p.id}`)}
                        className="group flex items-center justify-between p-3 hover:bg-indigo-50/50 border border-transparent hover:border-indigo-100/50 rounded-2xl cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold font-mono">
                            {p.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800 group-hover:text-indigo-900 transition-colors">{p.fullName}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{p.code} · {p.phone || 'No phone'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100/50 opacity-0 group-hover:opacity-100 transition-opacity">View Profile</span>
                          <CornerDownLeft className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category: Doctors */}
              {doctors.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5">
                    <Stethoscope className="w-3 h-3" /> Doctors ({doctors.length})
                  </h4>
                  <div className="space-y-1">
                    {doctors.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => handleNavigate('/doctors')}
                        className="group flex items-center justify-between p-3 hover:bg-emerald-50/50 border border-transparent hover:border-emerald-100/50 rounded-2xl cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">
                            DR
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800 group-hover:text-emerald-900 transition-colors">Dr. {d.fullName || d.user?.fullName}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{d.specialty?.name}</p>
                          </div>
                        </div>
                        <CornerDownLeft className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category: Appointments */}
              {appointments.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> Appointments ({appointments.length})
                  </h4>
                  <div className="space-y-1">
                    {appointments.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => handleNavigate('/appointments')}
                        className="group flex items-center justify-between p-3 hover:bg-cyan-50/50 border border-transparent hover:border-cyan-100/50 rounded-2xl cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center text-xs font-bold">
                            CAL
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate group-hover:text-cyan-900 transition-colors">
                              {a.patient?.fullName} w/ Dr. {a.doctor?.user?.fullName || a.doctor?.fullName}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate font-semibold uppercase">
                              {a.service?.name} · {formatDateTime(a.startTime)}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          a.status === 'Confirmed' ? 'bg-green-50 text-green-700 border border-green-150' :
                          a.status === 'Done' ? 'bg-blue-50 text-blue-700 border border-blue-150' :
                          a.status === 'Cancelled' ? 'bg-red-50 text-red-700 border border-red-150' :
                          'bg-amber-50 text-amber-700 border border-amber-150'
                        }`}>
                          {a.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category: Products */}
              {products.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5">
                    <Package className="w-3 h-3" /> Products ({products.length})
                  </h4>
                  <div className="space-y-1">
                    {products.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleNavigate('/stock/products')}
                        className="group flex items-center justify-between p-3 hover:bg-purple-50/50 border border-transparent hover:border-purple-100/50 rounded-2xl cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">
                            SKU
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800 group-hover:text-purple-900 transition-colors">{p.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                              SKU: {p.sku || 'N/A'} · Price: {formatCurrency(p.sellingPrice)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-black uppercase ${p.currentStock > 10 ? 'text-green-600' : p.currentStock > 0 ? 'text-amber-500' : 'text-red-500'}`}>
                            {p.currentStock} Units
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category: Vendors */}
              {vendors.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5">
                    <Truck className="w-3 h-3" /> Vendors ({vendors.length})
                  </h4>
                  <div className="space-y-1">
                    {vendors.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => handleNavigate('/stock/vendors')}
                        className="group flex items-center justify-between p-3 hover:bg-orange-50/50 border border-transparent hover:border-orange-100/50 rounded-2xl cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">
                            VND
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800 group-hover:text-orange-900 transition-colors">{v.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{v.contactName || 'No contact'} · {v.phone || 'No phone'}</p>
                          </div>
                        </div>
                        <CornerDownLeft className="w-3.5 h-3.5 text-gray-300 group-hover:text-orange-500 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="border-t border-gray-100 p-4 bg-gray-50 flex items-center justify-between text-[10px] text-gray-400">
          <div className="flex items-center gap-3">
            <span>Type queries to search</span>
            <span>·</span>
            <span>Shortcut: <kbd className="bg-white border border-gray-200 rounded px-1 text-[9px] font-mono">⌘K</kbd></span>
          </div>
          <span className="italic font-mono">Tashgheel Clinic Command Palette</span>
        </div>
      </div>
    </div>
  );
}
