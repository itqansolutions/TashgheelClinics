import { useQuery } from '@tanstack/react-query';
import { stockApi } from '@/api/stock';
import { STOCK_KEYS } from '@/hooks/useStock';
import { Modal } from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/Loader';
import { formatDate, formatCurrency } from '@/utils/format';
import { 
  Package, 
  History, ArrowUpRight, 
  ArrowDownRight, RefreshCw
} from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

export function StockCardModal({ isOpen, onClose, product }: Props) {
  const { data: ledgerData, isLoading } = useQuery({
    queryKey: STOCK_KEYS.ledger(product?.id),
    queryFn: async () => {
      const res = await stockApi.getProductLedger(product.id);
      return res.data;
    },
    enabled: !!product?.id && isOpen
  });

  const ledger = ledgerData?.data || [];

  return (
    <Modal open={isOpen} onClose={onClose} title="Stock Card / Product History" size="xl">
      {isLoading ? (
        <div className="py-20 flex justify-center"><PageLoader /></div>
      ) : (
        <div className="space-y-8 pb-4">
          {/* Product Info Header */}
          <div className="flex items-start gap-6 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
            <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
              <Package className="w-8 h-8 text-brand-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-gray-900">{product?.name}</h3>
                <span className="px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {product?.code}
                </span>
              </div>
              <p className="text-sm text-gray-500 font-medium mt-1">{product?.category || 'General Product'}</p>
              
              <div className="grid grid-cols-3 gap-8 mt-6">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Stock</p>
                  <p className="text-lg font-black text-gray-900">{product?.currentStock} {product?.unit}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Avg Cost</p>
                  <p className="text-lg font-black text-gray-900">{formatCurrency(product?.averageCost)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Value</p>
                  <p className="text-lg font-black text-brand-600">{formatCurrency(product?.currentStock * Number(product?.averageCost))}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div>
            <div className="flex items-center gap-2 mb-4 px-2">
              <History className="w-5 h-5 text-gray-400" />
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Transaction History</h4>
            </div>
            
            <div className="border border-gray-100 rounded-3xl overflow-hidden bg-white shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Qty</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">After</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ledger.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-gray-900">{formatDate(tx.createdAt)}</p>
                        <p className="text-[9px] text-gray-400 font-medium">{new Date(tx.createdAt).toLocaleTimeString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className={clsx(
                          "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                          tx.type === 'Purchase' ? "bg-green-50 text-green-700" :
                          tx.type === 'Usage' ? "bg-red-50 text-red-700" :
                          tx.type === 'Adjustment' ? "bg-amber-50 text-amber-700" : "bg-gray-50 text-gray-700"
                        )}>
                          {tx.type === 'Purchase' && <ArrowUpRight className="w-3 h-3" />}
                          {tx.type === 'Usage' && <ArrowDownRight className="w-3 h-3" />}
                          {tx.type === 'Adjustment' && <RefreshCw className="w-3 h-3" />}
                          {tx.type}
                        </div>
                      </td>
                      <td className={clsx(
                        "px-6 py-4 text-center text-xs font-black",
                        tx.quantity > 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {tx.quantity > 0 ? '+' : ''}{tx.quantity}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-bold text-gray-700">{tx.balanceAfter}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono font-bold text-gray-900">
                        {formatCurrency(tx.cost)}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[10px] text-gray-400 font-medium max-w-[150px] truncate" title={tx.notes}>
                          {tx.notes || '—'}
                        </p>
                      </td>
                    </tr>
                  ))}
                  {ledger.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-xs italic">
                        No transactions recorded for this item.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
