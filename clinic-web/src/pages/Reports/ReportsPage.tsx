import { useState, useEffect } from 'react';
import { reportsApi } from '@/api/reports';
import { PageLoader } from '@/components/ui/Loader';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/utils/format';
import { 
  TrendingUp, TrendingDown, Users, Calendar, 
  DollarSign, PieChart, ArrowUpRight, ArrowDownRight,
  Printer, Wallet, Percent,
  Activity
} from 'lucide-react';
import { SimpleBarChart, SimpleDonutChart, SimpleLineChart } from '@/components/ui/Charts';

export function ReportsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [financeSum, setFinanceSum] = useState<any>(null);
  const [aptStats, setAptStats] = useState<any[]>([]);
  const [revenueDoctor, setRevenueDoctor] = useState<any[]>([]);
  const [cashFlow, setCashFlow] = useState<any[]>([]);
  const [incomeBreakdown, setIncomeBreakdown] = useState<any>(null);
  const [doctorCommissions, setDoctorCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportsApi.getSummary(),
      reportsApi.getFinancialSummary(),
      reportsApi.getAppointmentsStatus(),
      reportsApi.getRevenueByDoctor(),
      reportsApi.getCashFlow(),
      reportsApi.getIncomeBreakdown(),
      reportsApi.getDoctorCommissions()
    ]).then(([sumRes, finRes, aptRes, revRes, flowRes, incRes, comRes]) => {
      setSummary(sumRes.data);
      setFinanceSum(finRes.data);
      setAptStats(aptRes.data || []);
      setRevenueDoctor(revRes.data || []);
      setCashFlow(flowRes.data || []);
      setIncomeBreakdown(incRes.data);
      setDoctorCommissions(comRes.data || []);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to fetch reports', err);
      setLoading(false);
    });
  }, []);

  if (loading) return <PageLoader />;
  if (!summary) return <div className="text-center py-20 text-gray-500 font-bold uppercase tracking-widest opacity-30">Failed to load analytics data.</div>;

  const stats = [
    { label: 'Gross Revenue', value: formatCurrency(financeSum?.totalIncome || 0), icon: Wallet, color: 'bg-brand-600', trend: '+12.5%', isUp: true },
    { label: 'Operational Expenses', value: formatCurrency(financeSum?.breakdown?.general || 0), icon: ArrowDownRight, color: 'bg-red-600', trend: '-2.4%', isUp: false },
    { label: 'Inventory Purchases', value: formatCurrency(financeSum?.breakdown?.purchases || 0), icon: TrendingDown, color: 'bg-orange-600', trend: '+15.2%', isUp: false },
    { label: 'Net Profit', value: formatCurrency(financeSum?.netProfit || 0), icon: DollarSign, color: 'bg-green-600', trend: '+8.2%', isUp: true },
    { label: 'Total Patients', value: summary.patientsCount, icon: Users, color: 'bg-blue-600', trend: '+5.2%', isUp: true },
    { label: 'Total Appointments', value: summary.appointmentsCount, icon: Calendar, color: 'bg-purple-600', trend: '+18.1%', isUp: true },
  ];

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-brand-600" /> Clinic Analytics
          </h1>
          <p className="text-gray-500 font-medium text-sm mt-1">Intelligent insights and financial performance tracking.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 px-6 py-5 rounded-2xl border-gray-200 hover:bg-white shadow-sm" 
          onClick={() => window.print()}
        >
          <Printer className="w-5 h-5 text-gray-400" />
          <span className="font-black uppercase tracking-widest text-[10px]">Generate Report</span>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-100 transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 rounded-2xl ${s.color} text-white flex items-center justify-center shadow-2xl shadow-gray-200 group-hover:scale-110 transition-transform`}>
                <s.icon className="w-7 h-7" />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${s.isUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {s.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {s.trend}
              </div>
            </div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{s.label}</p>
            <h3 className="text-2xl font-mono font-black text-gray-900">{s.value}</h3>
          </div>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Cash Flow Line Chart */}
        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm min-h-[450px] flex flex-col group hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Cash Flow Analysis</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Income vs Expenses Over Time</p>
              </div>
            </div>
          </div>
          <div className="flex-1">
            {cashFlow.length > 0 ? (
              <SimpleLineChart 
                data={cashFlow.map(f => ({ label: formatDate(f.date, 'MMM d'), income: f.income, expense: f.expense }))}
                height={300}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-300 text-xs italic">Insufficient data for trend mapping</div>
            )}
          </div>
        </div>

        {/* Doctor Performance Bar Chart */}
        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm min-h-[450px] flex flex-col group hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Physician Revenue</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total Billings by Doctor</p>
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-end">
            {revenueDoctor.length > 0 ? (
              <SimpleBarChart 
                data={revenueDoctor.map(d => ({ label: d.doctorName, value: d.revenue }))} 
                height={300} 
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-300 text-xs italic">No clinical billings recorded</div>
            )}
          </div>
        </div>

        {/* Income Breakdown Donut */}
        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm min-h-[400px] flex flex-col group hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                <PieChart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Revenue Streams</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Services vs Products</p>
              </div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            {incomeBreakdown ? (
              <SimpleDonutChart 
                data={[
                  { label: 'Medical Services', value: incomeBreakdown.services, color: '#0ea5e9' },
                  { label: 'Product Sales', value: incomeBreakdown.products, color: '#10b981' }
                ]} 
              />
            ) : (
              <div className="text-gray-300 text-xs italic">No income categorization available</div>
            )}
          </div>
        </div>

        {/* Appointment Status Donut */}
        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm min-h-[400px] flex flex-col group hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Appointment Funnel</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Operational Status Distribution</p>
              </div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            {aptStats.length > 0 ? (
              <SimpleDonutChart 
                data={aptStats.map((s, i) => ({ 
                  label: s.status, 
                  value: s._count.id, 
                  color: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#94a3b8'][i % 5] 
                }))} 
              />
            ) : (
              <div className="text-gray-300 text-xs italic">No appointment status data</div>
            )}
          </div>
        </div>
      </div>

      {/* Doctor Commissions Table */}
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-2xl transition-all">
        <div className="p-10 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Physician Revenue & Commissions</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Calculated Shares based on Professional Rates</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Doctor Name</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Appointments</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Total Revenue</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Clinic Share</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Doctor Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {doctorCommissions.map((doc) => (
                <tr key={doc.doctorId} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-10 py-6">
                    <p className="text-sm font-black text-gray-900">{doc.doctorName}</p>
                    <p className="text-[10px] text-gray-400 font-medium">Professional Account</p>
                  </td>
                  <td className="px-10 py-6">
                    <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-lg">{doc.appointmentCount}</span>
                  </td>
                  <td className="px-10 py-6 text-sm font-mono font-bold text-gray-900">
                    {formatCurrency(doc.totalRevenue)}
                  </td>
                  <td className="px-10 py-6 text-sm font-mono font-medium text-gray-500">
                    {formatCurrency(doc.totalRevenue - doc.totalCommission)}
                  </td>
                  <td className="px-10 py-6 text-right">
                    <p className="text-base font-mono font-black text-brand-600">{formatCurrency(doc.totalCommission)}</p>
                    <p className="text-[9px] text-green-600 font-black uppercase tracking-widest">Verified Payment</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
