import { useState } from 'react';
import { useProducts } from '@/hooks/useStock';
import { Button } from '@/components/ui/Button';
import { Search, Plus, Trash2, Package, Boxes, Scale } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface UsedItem {
  productId: number;
  name: string;
  code: string;
  quantity: number;
  costAtTime: number;
  priceAtTime: number;
  unit: string;
}

interface Props {
  usedItems: UsedItem[];
  onChange: (items: UsedItem[]) => void;
}

export function InventoryUsageTab({ usedItems, onChange }: Props) {
  const [search, setSearch] = useState('');
  const { data: productsData } = useProducts();
  const products = productsData?.data || [];

  const filtered = products.filter((p: any) => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  const addItem = (product: any) => {
    if (usedItems.find(i => i.productId === product.id)) return;
    
    onChange([...usedItems, {
      productId: product.id,
      name: product.name,
      code: product.code,
      quantity: 1,
      costAtTime: Number(product.averageCost),
      priceAtTime: Number(product.sellingPrice),
      unit: product.unit
    }]);
  };

  const removeItem = (productId: number) => {
    onChange(usedItems.filter(i => i.productId !== productId));
  };

  const updateQty = (productId: number, qty: number) => {
    onChange(usedItems.map(i => i.productId === productId ? { ...i, quantity: qty } : i));
  };

  const totalCost = usedItems.reduce((sum, i) => sum + (i.quantity * i.costAtTime), 0);

  return (
    <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-[500px]">
      {/* Left: Product Search */}
      <div className="space-y-4 flex flex-col h-full">
        <div className="flex items-center justify-between shrink-0">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
            <Package className="w-4 h-4 text-brand-600" /> Available Inventory
          </h3>
        </div>

        <div className="relative shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search items to use..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {filtered.map((p: any) => (
            <button
              key={p.id}
              onClick={() => addItem(p)}
              className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-left hover:border-brand-500 hover:shadow-md transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-brand-50 transition-colors">
                  <Boxes className="w-5 h-5 text-gray-400 group-hover:text-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{p.name}</p>
                  <p className="text-[10px] text-gray-400 font-mono">{p.code} · {p.currentStock} {p.unit} Available</p>
                </div>
              </div>
              <Plus className="w-4 h-4 text-gray-300 group-hover:text-brand-600" />
            </button>
          ))}
        </div>
      </div>

      {/* Right: Selected Items */}
      <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-100 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-brand-600" /> Used in Session
          </h3>
          <span className="text-[10px] font-black text-gray-400 uppercase bg-white px-3 py-1 rounded-full border border-gray-200">
            {usedItems.length} Items
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 mb-6 pr-2 custom-scrollbar">
          {usedItems.map((item) => (
            <div key={item.productId} className="bg-white p-4 rounded-2xl shadow-sm border border-white flex items-center justify-between animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-700 font-bold text-[10px]">
                  {item.unit.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">{item.name}</p>
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest">{formatCurrency(item.priceAtTime)} / {item.unit}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
                  <button 
                    onClick={() => updateQty(item.productId, Math.max(0.1, item.quantity - 0.5))}
                    className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-lg transition-colors text-gray-500"
                  >
                    -
                  </button>
                  <input 
                    type="number"
                    className="w-12 text-center bg-transparent border-none text-xs font-bold focus:ring-0 p-0"
                    value={item.quantity}
                    onChange={(e) => updateQty(item.productId, Number(e.target.value))}
                  />
                  <button 
                    onClick={() => updateQty(item.productId, item.quantity + 0.5)}
                    className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-xl transition-colors text-gray-500"
                  >
                    +
                  </button>
                </div>
                <button 
                  onClick={() => removeItem(item.productId)}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {usedItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
              <ShoppingCart className="w-12 h-12 mb-4" />
              <p className="text-xs font-bold uppercase tracking-widest">No items selected</p>
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/50 shadow-sm shrink-0">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Internal Cost</span>
            <span className="text-sm font-mono font-bold text-gray-500">{formatCurrency(totalCost)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-50">
            <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Est. Patient Price</span>
            <span className="text-lg font-mono font-black text-brand-600">
              {formatCurrency(usedItems.reduce((sum, i) => sum + (i.quantity * i.priceAtTime), 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add missing icon
import { ShoppingCart } from 'lucide-react';
