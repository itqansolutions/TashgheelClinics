import { useState, useRef } from 'react';
import { useFinanceQueue, useFinanceTransactions } from '@/hooks/useFinance';
import { useReactToPrint } from 'react-to-print';
import { PageLoader } from '@/components/ui/Loader';
import { Button } from '@/components/ui/Button';
import { 
  Wallet, 
  Receipt, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Plus, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Printer,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/format';
import { CollectPaymentModal } from './modals/CollectPaymentModal';
import { MakeTransactionModal } from './modals/MakeTransactionModal';
import { InvoiceTemplate } from '@/components/finance/InvoiceTemplate';

export function FinancePage() {
  const [activeTab, setActiveTab] = useState<'queue' | 'ledger'>('queue');
  const [search, setSearch] = useState('');
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  const invoiceRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice_${selectedAppointment?.id || 'Doc'}`,
  });

  const onPrintClick = (apt: any) => {
    setSelectedAppointment(apt);
    setTimeout(() => handlePrint(), 100);
  };

  const { data: queueData, isLoading: isQueueLoading } = useFinanceQueue();
  const { data: ledgerData, isLoading: isLedgerLoading } = useFinanceTransactions();

  const queue = queueData?.data || [];
  const ledger = ledgerData?.data || [];

  const filteredQueue = queue.filter((item: any) => 
    item.patient?.fullName.toLowerCase().includes(search.toLowerCase()) ||
    item.patient?.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Wallet className="w-8 h-8 text-brand-600" /> Financial Management
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Monitor cash flow, process payments, and manage expenses.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            className="bg-brand-600 hover:bg-brand-700 shadow-xl shadow-brand-100 rounded-2xl px-6 py-6 h-auto"
            leftIcon={<Plus className="w-5 h-5" />}
            onClick={() => setIsTxModalOpen(true)}
          >
            Make Transaction
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-brand-200 transition-all">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Revenue (MTD)</p>
            <h3 className="text-2xl font-mono font-black text-gray-900">{formatCurrency(45800)}</h3>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="w-3 h-3 text-green-500" />
              <span className="text-[10px] font-bold text-green-600">+12% vs last month</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingUp className="w-6 h-6 text-brand-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-red-200 transition-all">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Expenses (MTD)</p>
            <h3 className="text-2xl font-mono font-black text-gray-900">{formatCurrency(12400)}</h3>
            <div className="flex items-center gap-1 mt-2">
              <ArrowDownLeft className="w-3 h-3 text-red-500" />
              <span className="text-[10px] font-bold text-red-600">+5% vs last month</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-green-200 transition-all">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Net Profit (MTD)</p>
            <h3 className="text-2xl font-mono font-black text-brand-600">{formatCurrency(33400)}</h3>
            <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-brand-500 uppercase tracking-widest">
              Healthy Margin
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        {/* Tabs */}
        <div className="flex items-center px-8 border-b border-gray-50 bg-gray-50/50 shrink-0">
          <button 
            onClick={() => setActiveTab('queue')}
            className={`px-8 py-5 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'queue' ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Payment Queue
            {activeTab === 'queue' && <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-600 rounded-t-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('ledger')}
            className={`px-8 py-5 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'ledger' ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Financial Ledger
            {activeTab === 'ledger' && <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-600 rounded-t-full" />}
          </button>
          
          <div className="ml-auto flex items-center gap-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="rounded-xl h-9 border-gray-200">
              <Filter className="w-4 h-4 text-gray-400" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'queue' ? (
            isQueueLoading ? <PageLoader /> : (
              <div className="space-y-4">
                {filteredQueue.map((item: any) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-gray-50/50 rounded-3xl border border-gray-100 hover:border-brand-300 hover:bg-white hover:shadow-xl transition-all group animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-brand-600 transition-colors">
                        <Receipt className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-gray-900">{item.patient?.fullName}</h4>
                          <span className="text-[10px] font-black text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full uppercase tracking-widest">{item.patient?.code}</span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">Dr. {item.doctor?.fullName} · {item.service?.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-[10px] text-gray-400 font-bold">{formatDate(item.startTime, 'MMM d, h:mm a')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 sm:mt-0 flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Due</p>
                        <p className="text-xl font-mono font-black text-gray-900">{formatCurrency(item.priceCharged)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          className="rounded-xl bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-100"
                          onClick={() => {
                            setSelectedAppointment(item);
                            setIsCollectModalOpen(true);
                          }}
                        >
                          Collect Payment
                        </Button>
                        <button 
                          onClick={() => onPrintClick(item)}
                          className="p-2 hover:bg-gray-200 rounded-xl transition-colors"
                        >
                          <Printer className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredQueue.length === 0 && (
                  <div className="py-20 text-center opacity-30">
                    <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
                    <p className="text-sm font-black uppercase tracking-widest text-gray-500">All payments up to date</p>
                  </div>
                )}
              </div>
            )
          ) : (
            isLedgerLoading ? <PageLoader /> : (
              <div className="space-y-3">
                {ledger.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'Income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {tx.type === 'Income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-900">{tx.category || 'General'}</p>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${tx.method === 'Cash' ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                            {tx.method}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium">{tx.description} · {formatDate(tx.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-base font-mono font-black ${tx.type === 'Income' ? 'text-brand-600' : 'text-red-600'}`}>
                        {tx.type === 'Income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Added by {tx.user?.fullName}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      <CollectPaymentModal 
        isOpen={isCollectModalOpen}
        onClose={() => setIsCollectModalOpen(false)}
        appointment={selectedAppointment}
      />

      <MakeTransactionModal 
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
      />

      <div className="hidden">
        <InvoiceTemplate ref={invoiceRef} appointment={selectedAppointment} />
      </div>
    </div>
  );
}
