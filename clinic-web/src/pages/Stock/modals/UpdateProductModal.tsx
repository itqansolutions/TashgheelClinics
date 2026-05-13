import { useState, useEffect } from 'react';
import { useUpdateProduct, useVendors } from '@/hooks/useStock';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Tag, Hash, Bookmark, DollarSign } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

export function UpdateProductModal({ isOpen, onClose, product }: Props) {
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
  const updateMutation = useUpdateProduct();
  const vendors = vendorsData?.data || [];

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        code: product.code || '',
        barcode: product.barcode || '',
        category: product.category || '',
        unit: product.unit || 'Piece',
        minStock: product.minStock || 0,
        sellingPrice: Number(product.sellingPrice) || 0,
        vendorId: product.vendorId?.toString() || '',
      });
    }
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({
        id: product.id,
        data: {
          ...formData,
          minStock: Number(formData.minStock),
          sellingPrice: Number(formData.sellingPrice),
          vendorId: formData.vendorId ? Number(formData.vendorId) : null
        }
      });
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal 
      open={isOpen} 
      onClose={onClose} 
      title="Edit Product Details" 
      subtitle={product?.name}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Name</label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                required
                placeholder="e.g. Botox 100 Units"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 font-bold"
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
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 font-mono font-bold"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Selling Price</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-600" />
              <input
                type="number"
                step="0.01"
                required
                className="w-full pl-11 pr-4 py-3 bg-brand-50/50 border border-brand-100 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 font-mono font-black text-brand-700"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
            <div className="relative">
              <Bookmark className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Unit</label>
            <select
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 appearance-none"
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

          <div className="col-span-2 space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Primary Vendor</label>
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
            loading={updateMutation.isPending}
          >
            Update Details
          </Button>
        </div>
      </form>
    </Modal>
  );
}
