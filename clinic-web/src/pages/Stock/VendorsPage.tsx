import { useState } from 'react';
import { useVendors } from '@/hooks/useStock';
import { PageLoader } from '@/components/ui/Loader';
import { Button } from '@/components/ui/Button';
import { Users2, Plus, Search, Phone, Mail, MapPin, ExternalLink, ArrowRight } from 'lucide-react';
import { CreateVendorModal } from './modals/CreateVendorModal';
import { VendorStatementModal } from './modals/VendorStatementModal';

export function VendorsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useVendors();

  const vendors = data?.data || [];
  const filtered = vendors.filter((v: any) => 
    v.name.toLowerCase().includes(search.toLowerCase()) || 
    v.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Suppliers & Vendors</h1>
          <p className="text-sm text-gray-500 font-medium">Manage your procurement relationships.</p>
        </div>
        <Button 
          size="sm" 
          leftIcon={<Plus className="w-4 h-4" />} 
          className="bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-100"
          onClick={() => setIsModalOpen(true)}
        >
          Add Supplier
        </Button>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search suppliers by name or email..."
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
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Supplier</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Information</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Address</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((vendor: any) => (
                <tr key={vendor.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                        <Users2 className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">{vendor.name}</p>
                        <p className="text-[10px] text-brand-600 font-bold mt-0.5">Active Vendor</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Phone className="w-3 h-3 text-gray-400" /> {vendor.phone || 'N/A'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Mail className="w-3 h-3 text-gray-400" /> {vendor.email || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-gray-600 max-w-xs truncate">
                      <MapPin className="w-3 h-3 text-gray-400" /> {vendor.address || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-xl h-8 text-[10px] font-black uppercase tracking-widest gap-1.5"
                        onClick={() => {
                          setSelectedVendor(vendor);
                          setIsStatementOpen(true);
                        }}
                      >
                        Statement <ExternalLink className="w-3 h-3" />
                      </Button>
                      <button className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <Users2 className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium italic">No suppliers found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateVendorModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <VendorStatementModal 
        isOpen={isStatementOpen}
        onClose={() => setIsStatementOpen(false)}
        vendor={selectedVendor}
      />
    </div>
  );
}

