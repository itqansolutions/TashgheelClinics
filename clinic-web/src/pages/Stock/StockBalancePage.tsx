import { useState } from 'react';
import { useStockBalances } from '@/hooks/useStock';
import { PageLoader } from '@/components/ui/Loader';
import { Button } from '@/components/ui/Button';
import { 
  Boxes, Plus, Search, Filter, AlertTriangle, 
  TrendingUp, Wallet, Package, ArrowUpRight 
} from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { clsx } from 'clsx';
import { RecordPurchaseModal } from './modals/RecordPurchaseModal';
import { StockCardModal } from './modals/StockCardModal';

export function StockBalancePage() {
  const { data, isLoading } = useStockBalances();
  const [search, setSearch] = useState('');
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  
  const balances = data?.data || [];
  const filtered = balances.filter((b: any) => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.code.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = balances.filter((b: any) => b.currentStock <= b.minStock).length;
  const totalValuation = balances.reduce((sum: number, b: any) => sum + (b.currentStock * Number(b.averageCost)), 0);

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Stock Balance</h1>
          <p className="text-sm text-gray-500 font-medium">Real-time inventory levels and valuation.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Export
          </Button>
          <Button 
            size="sm" 
            leftIcon={<Plus className="w-4 h-4" />} 
            className="bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-100"
            onClick={() => setIsPurchaseModalOpen(true)}
          >
            Record Purchase
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Items</p>
            <h3 className="text-2xl font-bold text-gray-900">{balances.length}</h3>
          </div>
          <Package className="absolute -right-2 -bottom-2 w-16 h-16 text-gray-50 opacity-50 group-hover:text-brand-50 transition-colors" />
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Low Stock Alerts</p>
            <h3 className={clsx("text-2xl font-bold", lowStockCount > 0 ? "text-amber-500" : "text-gray-900")}>
              {lowStockCount}
            </h3>
          </div>
          <AlertTriangle className={clsx("absolute -right-2 -bottom-2 w-16 h-16 opacity-50 transition-colors", lowStockCount > 0 ? "text-amber-50" : "text-gray-50")} />
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Inventory Valuation</p>
            <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(totalValuation)}</h3>
          </div>
          <Wallet className="absolute -right-2 -bottom-2 w-16 h-16 text-gray-50 opacity-50 group-hover:text-green-50 transition-colors" />
        </div>

        <div className="bg-brand-600 p-5 rounded-3xl shadow-xl shadow-brand-100 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-brand-100 uppercase tracking-widest mb-1">Monthly Usage</p>
            <h3 className="text-2xl font-bold text-white">Coming Soon</h3>
          </div>
          <TrendingUp className="absolute -right-2 -bottom-2 w-16 h-16 text-white/10 group-hover:scale-110 transition-transform" />
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by product name or code..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            Showing {filtered.length} of {balances.length} Products
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Info</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock Level</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Avg Cost</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Value</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((item: any) => {
                const isLow = item.currentStock <= item.minStock;
                const isOut = item.currentStock === 0;
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 leading-tight">{item.name}</p>
                          <p className="text-[10px] font-mono font-bold text-brand-600 mt-0.5">{item.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        {item.category || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={clsx(
                            "text-sm font-bold",
                            isOut ? "text-red-600" : isLow ? "text-amber-500" : "text-gray-900"
                          )}>
                            {item.currentStock} {item.unit}
                          </span>
                          {isLow && (
                            <div className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span className="text-[9px] font-black uppercase">Low</span>
                            </div>
                          )}
                        </div>
                        <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={clsx(
                              "h-full rounded-full transition-all duration-500",
                              isOut ? "w-0" : isLow ? "bg-amber-500 w-1/3" : "bg-green-500 w-full"
                            )}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-mono font-bold text-gray-700">{formatCurrency(item.averageCost)}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Per {item.unit}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-mono font-black text-gray-900">
                        {formatCurrency(item.currentStock * Number(item.averageCost))}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        className="p-2 hover:bg-brand-50 text-gray-400 hover:text-brand-600 rounded-xl transition-all"
                        onClick={() => {
                          setSelectedProduct(item);
                          setIsCardModalOpen(true);
                        }}
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <Boxes className="w-12 h-12 text-gray-100 mb-4" />
                      <p className="text-gray-400 font-medium italic">No products match your search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <RecordPurchaseModal 
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
      />
      <StockCardModal 
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
}

