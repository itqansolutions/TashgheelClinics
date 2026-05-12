import { useState, useEffect } from 'react';
import { reportsApi } from '@/api/reports';
import { PageLoader } from '@/components/ui/Loader';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/format';
import { 
  BarChart3, TrendingUp, Users, Calendar, 
  DollarSign, PieChart, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';

export function ReportsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.getSummary().then(res => {
      setSummary(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <PageLoader />;

  const stats = [
    { label: 'Total Revenue', value: formatCurrency(summary.totalRevenue), icon: DollarSign, color: 'bg-green-500', trend: '+12.5%', isUp: true },
    { label: 'Total Patients', value: summary.patientsCount, icon: Users, color: 'bg-blue-500', trend: '+5.2%', isUp: true },
    { label: 'Appointments', value: summary.appointmentsCount, icon: Calendar, color: 'bg-purple-500', trend: '+18.1%', isUp: true },
    { label: 'Active Doctors', value: summary.doctorsCount, icon: TrendingUp, color: 'bg-orange-500', trend: 'Stable', isUp: true },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-500 text-sm">Real-time overview of clinic performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${s.color} text-white shadow-lg`}>
                <s.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${s.isUp ? 'text-green-600' : 'text-red-600'}`}>
                {s.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {s.trend}
              </div>
            </div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{s.label}</p>
            <h3 className="text-2xl font-black text-gray-900">{s.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Placeholder for Charts */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Revenue Growth</h3>
            </div>
            <select className="bg-gray-50 border-none text-xs font-bold rounded-lg px-3 py-2 outline-none">
              <option>Last 30 Days</option>
              <option>Last 6 Months</option>
            </select>
          </div>
          <div className="flex-1 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center p-12 text-center">
            <TrendingUp className="w-12 h-12 text-gray-300 mb-4" />
            <h4 className="text-sm font-bold text-gray-400 mb-2">Revenue Chart Loading...</h4>
            <p className="text-xs text-gray-300 max-w-xs">Connecting to analytics engine to generate visual reports</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                <PieChart className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Appointment Distribution</h3>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">Download CSV</Button>
          </div>
          <div className="flex-1 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center p-12 text-center">
            <PieChart className="w-12 h-12 text-gray-300 mb-4" />
            <h4 className="text-sm font-bold text-gray-400 mb-2">Distribution Chart Loading...</h4>
            <p className="text-xs text-gray-300 max-w-xs">Analyzing appointment status data for visual breakdown</p>
          </div>
        </div>
      </div>
    </div>
  );
}
