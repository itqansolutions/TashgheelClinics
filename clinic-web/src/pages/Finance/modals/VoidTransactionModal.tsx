import { useState } from 'react';
import { useVoidTransaction } from '@/hooks/useFinance';
import { Button } from '@/components/ui/Button';
import { X, Ban, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
}

export function VoidTransactionModal({ isOpen, onClose, transaction }: Props) {
  const voidMutation = useVoidTransaction();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Reason is required / سبب الإلغاء مطلوب');
      return;
    }
    try {
      await voidMutation.mutateAsync({ id: transaction.id, reason: reason.trim() });
      setReason('');
      setError('');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to void transaction');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Void Transaction</h3>
              <p className="text-[11px] text-gray-400 font-bold">إلغاء قيد مالي</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">{transaction.category || 'General'}</p>
              <p className="text-[11px] text-gray-500 font-medium">{transaction.description}</p>
            </div>
            <p className={`text-base font-mono font-black ${transaction.type === 'Income' ? 'text-brand-600' : 'text-red-600'}`}>
              {transaction.type === 'Income' ? '+' : '-'}{formatCurrency(transaction.amount)}
            </p>
          </div>

          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-2xl p-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
              The entry stays in the ledger marked void and is removed from all totals. This cannot be undone.
              <br />
              القيد يبقى في الدفتر معلّم كملغي ويُستبعد من كل الإجماليات. لا يمكن التراجع.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Reason <span className="text-red-500">*</span> / السبب
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 resize-none"
              placeholder="Why is this entry being voided? / لماذا يتم إلغاء هذا القيد؟"
              autoFocus
            />
          </div>

          {error && <p className="text-xs font-bold text-red-600">{error}</p>}

          <Button
            type="submit"
            loading={voidMutation.isPending}
            className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-2xl shadow-lg shadow-red-100"
          >
            Void Entry / إلغاء القيد
          </Button>
        </form>
      </div>
    </div>
  );
}
