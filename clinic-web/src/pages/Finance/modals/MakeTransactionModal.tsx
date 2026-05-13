import { useState } from 'react';
import { useCreateFinancialTransaction } from '@/hooks/useFinance';
import { Button } from '@/components/ui/Button';
import { X, ArrowUpRight, ArrowDownLeft, DollarSign, Tag, Calendar, FileText, Plus, ShoppingBag, Coffee, Wrench, Home, Users } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function MakeTransactionModal({ isOpen, onClose }: Props) {
  const createTxMutation = useCreateFinancialTransaction();
  
  const [type, setType] = useState<'Income' | 'Expense'>('Expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [method, setMethod] = useState('Cash');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) return;

    await createTxMutation.mutateAsync({
      type,
      amount: Number(amount),
      category,
      method,
      description,
      date: new Date(date),
    });

    onClose();
    setAmount('');
    setCategory('');
    setDescription('');
  };

  const expenseCategories = [
    { label: 'Rent', icon: <Home className="w-4 h-4" /> },
    { label: 'Salaries', icon: <Users className="w-4 h-4" /> },
    { label: 'Medical Supplies', icon: <ShoppingBag className="w-4 h-4" /> },
    { label: 'Maintenance', icon: <Wrench className="w-4 h-4" /> },
    { label: 'Utilities', icon: <FileText className="w-4 h-4" /> },
    { label: 'Office / Pantry', icon: <Coffee className="w-4 h-4" /> },
    { label: 'Other', icon: <Tag className="w-4 h-4" /> },
  ];

  const incomeCategories = [
    { label: 'Consultation Fees', icon: <Users className="w-4 h-4" /> },
    { label: 'Product Sales', icon: <ShoppingBag className="w-4 h-4" /> },
    { label: 'Refund / Adjustment', icon: <ArrowUpRight className="w-4 h-4" /> },
    { label: 'External Income', icon: <Plus className="w-4 h-4" /> },
    { label: 'Other', icon: <Tag className="w-4 h-4" /> },
  ];

  const activeCategories = type === 'Expense' ? expenseCategories : incomeCategories;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-white/20 animate-in fade-in zoom-in duration-300">
        <div className={`p-8 flex justify-between items-center text-white ${type === 'Expense' ? 'bg-red-600' : 'bg-brand-600'}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              {type === 'Expense' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Record {type}</h2>
              <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Manual Financial Entry</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Type Toggle */}
          <div className="flex bg-gray-100 p-1.5 rounded-[1.5rem]">
            <button
              type="button"
              onClick={() => setType('Expense')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${type === 'Expense' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Expense (-)
            </button>
            <button
              type="button"
              onClick={() => setType('Income')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${type === 'Income' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Income (+)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Amount *</label>
              <div className="relative group">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-500" />
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-lg font-mono font-black focus:ring-4 focus:ring-brand-500/10 transition-all"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Transaction Date</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-500" />
                <input
                  type="date"
                  required
                  className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand-500/10 transition-all"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Category</label>
            <div className="flex flex-wrap gap-2">
              {activeCategories.map((cat) => (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => setCategory(cat.label)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    category === cat.label 
                    ? 'bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-100' 
                    : 'bg-white border-gray-100 text-gray-500 hover:border-brand-200'
                  }`}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Method</label>
              <select
                className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand-500/10 appearance-none transition-all"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="Card">Visa / Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Vodafone Cash">Vodafone Cash</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description / Notes</label>
              <textarea
                rows={2}
                placeholder="Briefly describe this movement..."
                className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-4 focus:ring-brand-500/10 transition-all"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 py-6 rounded-2xl"
              onClick={onClose}
            >
              Discard
            </Button>
            <Button 
              type="submit"
              className={`flex-1 py-6 rounded-2xl text-white shadow-xl ${type === 'Expense' ? 'bg-red-600 hover:bg-red-700 shadow-red-100' : 'bg-brand-600 hover:bg-brand-700 shadow-brand-100'}`}
              loading={createTxMutation.isPending}
            >
              Confirm {type}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
