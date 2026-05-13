import { useState } from 'react';
import { useCreateProduct, useVendors } from '@/hooks/useStock';
import { Button } from '@/components/ui/Button';
import { X, Package, Tag, Hash, Bookmark, Scale } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProductModal({ isOpen, onClose }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    barcode: '',
    category: '',
    unit: 'Piece',
    minStock: 0,
    sellingPrice: 0,
    vendorId: '',
  });

  const { data: vendorsData } = useVendors();
  const createMutation = useCreateProduct();
  const vendors = vendorsData?.data || [];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        ...formData,
        minStock: Number(formData.minStock),
        sellingPrice: Number(formData.sellingPrice),
        vendorId: formData.vendorId ? Number(formData.vendorId) : null
      });
      onClose();
      setFormData({ name: '', code: '', barcode: '', category: '', unit: 'Piece', minStock: 0, sellingPrice: 0, vendorId: '' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-200">
        <div className="bg-brand-600 p-8 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Define New Product</h2>
              <p className="text-xs text-brand-100 font-medium opacity-80 uppercase tracking-widest">Inventory Management</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Name</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  required
                  placeholder="e.g. Botox 100 Units"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Internal Code</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  required
                  placeholder="BTX-100"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
              <div className="relative">
                <Bookmark className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  placeholder="Injections"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Unit of Measure</label>
              <div className="relative">
                <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 appearance-none"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                >
                  <option value="Piece">Piece</option>
                  <option value="ML">ML</option>
                  <option value="Gram">Gram</option>
                  <option value="Box">Box</option>
                  <option value="Vial">Vial</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Min Stock Alert</label>
              <input
                type="number"
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Primary Vendor (Optional)</label>
              <select
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20"
                value={formData.vendorId}
                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
              >
                <option value="">Select Vendor</option>
                {vendors.map((v: any) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" className="flex-1 rounded-2xl py-6" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-[2] rounded-2xl bg-brand-600 hover:bg-brand-700 py-6 shadow-lg shadow-brand-100"
              isLoading={createMutation.isPending}
            >
              Create Product
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
