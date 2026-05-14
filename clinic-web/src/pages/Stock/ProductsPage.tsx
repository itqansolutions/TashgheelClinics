import { useState } from 'react';
import { useProducts } from '@/hooks/useStock';
import { PageLoader } from '@/components/ui/Loader';
import { Button } from '@/components/ui/Button';
import { Package, Plus, Search, Tag, Layers, User, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { CreateProductModal } from './modals/CreateProductModal';
import { UpdateProductModal } from './modals/UpdateProductModal';
import { StockCardModal } from './modals/StockCardModal';

export function ProductsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useProducts();

  const products = data?.data || [];
  const filtered = products.filter((p: any) => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Products Registry</h1>
          <p className="text-sm text-gray-500 font-medium">Catalog of clinical supplies and items.</p>
        </div>
        <Button 
          size="sm" 
          leftIcon={<Plus className="w-4 h-4" />} 
          className="bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-100"
          onClick={() => setIsModalOpen(true)}
        >
          Define Product
        </Button>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name, code or category..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">General Info</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category & Unit</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Costs & Prices</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Primary Vendor</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((product: any) => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                        <Tag className="w-5 h-5 text-brand-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">{product.name}</p>
                        <p className="text-[10px] font-mono font-bold text-gray-400 mt-0.5 uppercase">{product.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <Layers className="w-3 h-3 text-gray-400" /> {product.category || 'N/A'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-md self-start">
                        {product.unit}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-4 max-w-[140px]">
                        <span className="text-[9px] font-black text-gray-400 uppercase">Avg Cost</span>
                        <span className="text-xs font-mono font-bold text-gray-900">{formatCurrency(product.averageCost)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 max-w-[140px]">
                        <span className="text-[9px] font-black text-gray-400 uppercase">Selling</span>
                        <span className="text-xs font-mono font-bold text-brand-600">{formatCurrency(product.sellingPrice)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-gray-300" />
                      <span className="text-xs font-medium text-gray-600">{product.vendor?.name || 'Multiple / Generic'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-xl h-8 text-[10px] font-black uppercase tracking-widest"
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsCardModalOpen(true);
                        }}
                      >
                        View Card
                      </Button>
                      <button 
                        className="p-2 hover:bg-brand-50 text-brand-600 rounded-xl transition-all"
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsUpdateModalOpen(true);
                        }}
                        title="Edit Product"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Package className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium italic">No products found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateProductModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <UpdateProductModal 
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        product={selectedProduct}
      />

      <StockCardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
}

