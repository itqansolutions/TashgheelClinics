import { useState } from 'react';
import { useProducts, useVendors, useRecordPurchase } from '@/hooks/useStock';
import { Button } from '@/components/ui/Button';
import { X, Plus, Trash2, ShoppingCart, User, Calendar, FileText, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function RecordPurchaseModal({ isOpen, onClose }: Props) {
  const { data: productsData } = useProducts();
  const { data: vendorsData } = useVendors();
  const recordPurchaseMutation = useRecordPurchase();

  const products = productsData?.data || [];
  const vendors = vendorsData?.data || [];

  const [formData, setFormData] = useState({
    vendorId: '',
    invoiceNo: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [items, setItems] = useState<any[]>([
    { productId: '', quantity: 1, costPerUnit: 0, batchNo: '', expiryDate: '' }
  ]);

  if (!isOpen) return null;

  const addItem = () => {
    setItems([...items, { productId: '', quantity: 1, costPerUnit: 0, batchNo: '', expiryDate: '' }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const total = items.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendorId || items.some(i => !i.productId)) {
      alert('Please fill all required fields');
      return;
    }

    try {
      await recordPurchaseMutation.mutateAsync({
        ...formData,
        items
      });
      onClose();
      setItems([{ productId: '', quantity: 1, costPerUnit: 0, batchNo: '', expiryDate: '' }]);
      setFormData({ vendorId: '', invoiceNo: '', purchaseDate: new Date().toISOString().split('T')[0], notes: '' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/20 animate-in fade-in slide-in-from-bottom-8 duration-300">
        <div className="bg-brand-600 p-8 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Record Purchase Order</h2>
              <p className="text-xs text-brand-100 font-medium opacity-80 uppercase tracking-widest">Inbound Inventory Transaction</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Vendor</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  required
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 appearance-none"
                  value={formData.vendorId}
                  onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                >
                  <option value="">Select Supplier</option>
                  {vendors.map((v: any) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Invoice Number</label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  placeholder="e.g. INV-2024-001"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20"
                  value={formData.invoiceNo}
                  onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Purchase Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-600" /> Line Items
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem} leftIcon={<Plus className="w-4 h-4" />}>
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100 items-end animate-in fade-in slide-in-from-right-4 duration-200">
                  <div className="col-span-4 space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Product</label>
                    <select
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20"
                      value={item.productId}
                      onChange={(e) => updateItem(index, 'productId', e.target.value)}
                    >
                      <option value="">Select Product</option>
                      {products.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Qty</label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Cost/Unit</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20"
                      value={item.costPerUnit}
                      onChange={(e) => updateItem(index, 'costPerUnit', Number(e.target.value))}
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Expiry</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-[10px] focus:ring-2 focus:ring-brand-500/20"
                      value={item.expiryDate}
                      onChange={(e) => updateItem(index, 'expiryDate', e.target.value)}
                    />
                  </div>

                  <div className="col-span-1 flex items-center justify-center">
                    <button 
                      type="button" 
                      onClick={() => removeItem(index)}
                      className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                      disabled={items.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="col-span-1 flex items-center justify-end font-mono font-bold text-[10px] text-gray-400 pb-2">
                    {formatCurrency(item.quantity * item.costPerUnit)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        <div className="p-8 bg-gray-50 border-t border-gray-100 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Invoice Amount</span>
                <span className="text-3xl font-mono font-black text-gray-900 leading-none">{formatCurrency(total)}</span>
              </div>
              <div className="w-px h-10 bg-gray-200 hidden md:block" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Line Items</span>
                <span className="text-xl font-bold text-gray-700">{items.length} Products</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" className="px-8 rounded-2xl" onClick={onClose}>
                Discard
              </Button>
              <Button 
                onClick={handleSubmit}
                className="px-10 rounded-2xl bg-brand-600 hover:bg-brand-700 shadow-xl shadow-brand-100 py-6"
                loading={recordPurchaseMutation.isPending}
                leftIcon={<DollarSign className="w-4 h-4" />}
              >
                Post Purchase Order
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
