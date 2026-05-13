import { useState } from 'react';
import { useVendorStatement, useRecordVendorPayment } from '@/hooks/useStock';
import { Button } from '@/components/ui/Button';
import { X, FileText, DollarSign, Calendar, TrendingUp, TrendingDown, Receipt, Wallet } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/format';
import { PageLoader } from '@/components/ui/Loader';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  vendor: any;
}

export function VendorStatementModal({ isOpen, onClose, vendor }: Props) {
  const { data: statementData, isLoading } = useVendorStatement(vendor?.id);
  const recordPaymentMutation = useRecordVendorPayment();
  
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  if (!isOpen || !vendor) return null;

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAmount) return;

    await recordPaymentMutation.mutateAsync({
      vendorId: vendor.id,
      amount: Number(paymentAmount),
      paymentMethod,
      notes: paymentNotes,
    });

    setPaymentAmount('');
    setPaymentNotes('');
  };

  const statement = statementData?.data || { purchases: [], payments: [], balance: 0 };
  
  // Combine and sort transactions
  const transactions = [
    ...statement.purchases.map((p: any) => ({
      id: `purch-${p.id}`,
      date: p.purchaseDate,
      type: 'Purchase',
      reference: p.invoiceNo || `#${p.id}`,
      amount: Number(p.totalAmount),
      impact: 'positive'
    })),
    ...statement.payments.map((p: any) => ({
      id: `pay-${p.id}`,
      date: p.paymentDate,
      type: 'Payment',
      reference: p.paymentMethod,
      amount: Number(p.amount),
      impact: 'negative'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-5xl h-[92vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/20 animate-in fade-in slide-in-from-bottom-8 duration-300">
        {/* Header */}
        <div className="bg-brand-600 p-8 text-white flex justify-between items-start shrink-0 relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.5rem] bg-white/20 flex items-center justify-center backdrop-blur-md shadow-inner">
              <Receipt className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">{vendor.name}</h2>
              <p className="text-xs text-brand-100 font-bold uppercase tracking-[0.2em] opacity-80">Vendor Account Statement</p>
            </div>
          </div>
          
          <div className="relative z-10 text-right">
            <p className="text-[10px] font-black text-brand-200 uppercase tracking-widest mb-1">Outstanding Balance</p>
            <p className="text-4xl font-mono font-black text-white">{formatCurrency(statement.balance)}</p>
          </div>

          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-20">
            <X className="w-6 h-6" />
          </button>

          {/* Decorative background circle */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left: Transaction History */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar border-r border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> Recent Transactions
              </h3>
            </div>

            {isLoading ? (
              <PageLoader />
            ) : (
              <div className="space-y-3">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100 group hover:border-brand-200 transition-all hover:bg-white hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.impact === 'positive' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                        {t.impact === 'positive' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900 uppercase tracking-wide">{t.type}</p>
                        <p className="text-[10px] text-gray-500 font-medium">{formatDate(t.date)} · Ref: {t.reference}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-mono font-black ${t.impact === 'positive' ? 'text-gray-900' : 'text-brand-600'}`}>
                        {t.impact === 'positive' ? '+' : '-'}{formatCurrency(t.amount)}
                      </p>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <div className="py-20 text-center opacity-30">
                    <FileText className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest">No transactions recorded</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Record Payment */}
          <div className="w-[380px] bg-gray-50/50 p-8 shrink-0">
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-brand-600" />
                </div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Record Payment</h3>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      required
                      placeholder="0.00"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-mono font-bold focus:ring-2 focus:ring-brand-500/20"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Method</label>
                  <select
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-500/20 appearance-none"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Visa / Card</option>
                    <option value="Bank">Bank Transfer</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Notes / Attachment</label>
                  <textarea
                    rows={3}
                    placeholder="Reference #, Bank name..."
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-xs focus:ring-2 focus:ring-brand-500/20"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full py-6 rounded-2xl bg-brand-600 hover:bg-brand-700 shadow-xl shadow-brand-100 mt-2"
                  loading={recordPaymentMutation.isPending}
                >
                  Pay to Vendor
                </Button>
              </form>
            </div>

            <div className="mt-8 p-6 bg-brand-50 rounded-[2rem] border border-brand-100">
              <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mb-4">Statement Summary</p>
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-brand-700 font-medium opacity-60">Total Purchases:</span>
                  <span className="font-mono font-bold text-brand-900">{formatCurrency(statement.purchases?.reduce((s: any, p: any) => s + Number(p.totalAmount), 0) || 0)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-brand-700 font-medium opacity-60">Total Paid:</span>
                  <span className="font-mono font-bold text-brand-900">{formatCurrency(statement.payments?.reduce((s: any, p: any) => s + Number(p.amount), 0) || 0)}</span>
                </div>
                <div className="h-px bg-brand-200 my-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-brand-900 font-black uppercase tracking-tighter">Current Balance:</span>
                  <span className="font-mono font-black text-brand-600">{formatCurrency(statement.balance)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
