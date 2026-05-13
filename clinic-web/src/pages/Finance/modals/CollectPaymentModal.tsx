import { useState, useEffect } from 'react';
import { useCollectPayment } from '@/hooks/useFinance';
import { Button } from '@/components/ui/Button';
import { X, DollarSign, CreditCard, Wallet, Smartphone, ShieldCheck, Percent, Info } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  appointment: any;
}

export function CollectPaymentModal({ isOpen, onClose, appointment }: Props) {
  const collectMutation = useCollectPayment();
  
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (appointment) {
      setAmount(String(appointment.priceCharged || 0));
    }
  }, [appointment]);

  if (!isOpen || !appointment) return null;

  const total = Number(appointment.priceCharged || 0);
  const remaining = total - Number(amount) - Number(discount);

  const handleCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    await collectMutation.mutateAsync({
      appointmentId: appointment.id,
      amount: Number(amount),
      method,
      notes: notes + (Number(discount) > 0 ? ` (Discount: ${discount})` : ''),
    });

    onClose();
  };

  const paymentMethods = [
    { id: 'Cash', label: 'Cash', icon: <Wallet className="w-5 h-5" />, color: 'orange' },
    { id: 'Card', label: 'Visa / Card', icon: <CreditCard className="w-5 h-5" />, color: 'blue' },
    { id: 'Vodafone Cash', label: 'Vodafone Cash', icon: <Smartphone className="w-5 h-5" />, color: 'red' },
    { id: 'Bank Transfer', label: 'Bank Transfer', icon: <DollarSign className="w-5 h-5" />, color: 'green' },
    { id: 'Insurance', label: 'Insurance', icon: <ShieldCheck className="w-5 h-5" />, color: 'purple' },
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-white w-full max-w-4xl h-[92vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-white/20 animate-in fade-in slide-in-from-bottom-12 duration-500">
        <div className="p-10 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[1.5rem] bg-brand-600 flex items-center justify-center shadow-xl shadow-brand-100">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">Collect Payment</h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Appointment #{appointment.id}</p>
                <div className="w-1 h-1 rounded-full bg-gray-300" />
                <p className="text-xs text-brand-600 font-black uppercase tracking-widest">{appointment.patient?.fullName}</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl shadow-sm border border-transparent hover:border-gray-100 transition-all">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleCollect} className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
          {/* Summary Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-brand-50/50 p-6 rounded-[2rem] border border-brand-100/50">
              <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mb-1 opacity-60">Service Amount</p>
              <h4 className="text-2xl font-mono font-black text-brand-900">{formatCurrency(total)}</h4>
            </div>
            <div className="bg-orange-50/50 p-6 rounded-[2rem] border border-orange-100/50">
              <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1 opacity-60">Paying Now</p>
              <h4 className="text-2xl font-mono font-black text-orange-900">{formatCurrency(Number(amount) || 0)}</h4>
            </div>
            <div className={`p-6 rounded-[2rem] border transition-colors ${remaining > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 opacity-60 ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {remaining > 0 ? 'Outstanding' : 'Balance'}
              </p>
              <h4 className={`text-2xl font-mono font-black ${remaining > 0 ? 'text-red-900' : 'text-green-900'}`}>
                {formatCurrency(remaining)}
              </h4>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <Percent className="w-4 h-4 text-brand-600" /> Payment Details
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Discount Amount</label>
                    <div className="relative group">
                      <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                      <input
                        type="number"
                        placeholder="0.00"
                        className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-base font-bold focus:ring-4 focus:ring-brand-500/10 transition-all"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Amount Collected *</label>
                    <div className="relative group">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                      <input
                        type="number"
                        required
                        placeholder="0.00"
                        className="w-full pl-11 pr-4 py-4 bg-brand-50/30 border-2 border-brand-100 rounded-2xl text-xl font-mono font-black text-brand-900 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Internal Notes</label>
                <div className="relative group">
                  <Info className="absolute left-4 top-4 w-4 h-4 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                  <textarea
                    rows={3}
                    placeholder="Transaction reference, receipt number, or special conditions..."
                    className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-4 focus:ring-brand-500/10 transition-all"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-600" /> Select Payment Method
              </h3>
              
              <div className="grid grid-cols-1 gap-3">
                {paymentMethods.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all relative overflow-hidden group ${
                      method === m.id 
                      ? `bg-${m.color}-50 border-${m.color}-200 shadow-lg shadow-${m.color}-100` 
                      : 'bg-white border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${method === m.id ? `bg-${m.color}-500 text-white` : 'bg-gray-50 text-gray-400'}`}>
                        {m.icon}
                      </div>
                      <span className={`text-sm font-black uppercase tracking-widest ${method === m.id ? `text-${m.color}-900` : 'text-gray-500'}`}>
                        {m.label}
                      </span>
                    </div>
                    {method === m.id && (
                      <div className="relative z-10 w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 text-white" />
                      </div>
                    )}
                    
                    {/* Decorative pattern for active item */}
                    {method === m.id && <div className={`absolute right-0 top-0 w-32 h-full bg-${m.color}-500/5 skew-x-[-20deg] translate-x-10`} />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </form>

        <div className="p-10 bg-gray-50 border-t border-gray-100 flex gap-4">
          <Button 
            type="button" 
            variant="outline" 
            className="px-10 py-6 h-auto text-sm font-black uppercase tracking-widest rounded-2xl hover:bg-white"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCollect}
            className="flex-1 py-6 h-auto text-sm font-black uppercase tracking-widest rounded-2xl bg-brand-600 hover:bg-brand-700 shadow-2xl shadow-brand-200 transition-all active:scale-[0.98]"
            loading={collectMutation.isPending}
            leftIcon={<DollarSign className="w-5 h-5" />}
          >
            Post Financial Transaction
          </Button>
        </div>
      </div>
    </div>
  );
}
