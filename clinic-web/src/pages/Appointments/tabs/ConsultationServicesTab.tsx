import { useState } from 'react';
import { useServicesList } from '@/hooks/useSpecialties';
import { Search, Plus, Trash2, Sparkles, Stethoscope, DollarSign, FileText } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { Button } from '@/components/ui/Button';

export interface ConsultationServiceItem {
  serviceId?: number;
  name: string;
  description: string;
  price: number;
}

interface Props {
  services: ConsultationServiceItem[];
  onChange: (services: ConsultationServiceItem[]) => void;
}

export function ConsultationServicesTab({ services, onChange }: Props) {
  const [search, setSearch] = useState('');
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  const { data: clinicServices = [] } = useServicesList();

  const filtered = clinicServices.filter((s: any) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const addPredefinedService = (service: any) => {
    onChange([
      ...services,
      {
        serviceId: service.id,
        name: service.name,
        description: '',
        price: Number(service.price || 0),
      },
    ]);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    onChange([
      ...services,
      {
        name: customName.trim(),
        description: customDesc.trim(),
        price: Number(customPrice) || 0,
      },
    ]);

    setCustomName('');
    setCustomDesc('');
    setCustomPrice('');
  };

  const removeService = (index: number) => {
    onChange(services.filter((_, i) => i !== index));
  };

  const updateServiceDesc = (index: number, description: string) => {
    onChange(services.map((item, i) => (i === index ? { ...item, description } : item)));
  };

  const updateServicePrice = (index: number, price: number) => {
    onChange(services.map((item, i) => (i === index ? { ...item, price } : item)));
  };

  const totalServicesValue = services.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);

  return (
    <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-[500px]">
      {/* Left: Predefined Services & Custom Service Form */}
      <div className="space-y-6 flex flex-col h-full">
        {/* Custom Service Entry Form */}
        <div className="bg-brand-50/50 rounded-2xl p-5 border border-brand-100/80">
          <h3 className="text-xs font-black text-brand-900 uppercase tracking-wider flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-brand-600" />
            Add Custom Service / Procedure (إضافة خدمة مخصصة)
          </h3>
          <form onSubmit={handleAddCustom} className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Service / Procedure Name (اسم الخدمة أو الإجراء)..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Clinical notes / description (الوصف)..."
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Price (القيمة)"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
            </div>
            <Button
              type="submit"
              size="sm"
              className="w-full bg-brand-600 hover:bg-brand-700 text-xs font-semibold py-2"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              disabled={!customName.trim()}
            >
              Add Procedure to Visit
            </Button>
          </form>
        </div>

        {/* Existing Clinic Services Catalog */}
        <div className="flex-1 flex flex-col min-h-0 space-y-3">
          <div className="flex items-center justify-between shrink-0">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-brand-600" /> Clinic Services Menu (قائمة الخدمات)
            </h3>
            <span className="text-[10px] text-gray-400 font-bold">{clinicServices.length} Available</span>
          </div>

          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search clinic services..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-60">
            {filtered.map((s: any) => (
              <div
                key={s.id}
                className="p-3 bg-white border border-gray-100 rounded-xl flex items-center justify-between hover:border-brand-400 hover:bg-brand-50/20 transition-all group"
              >
                <div>
                  <p className="text-xs font-bold text-gray-900">{s.name}</p>
                  <p className="text-[10px] font-mono text-gray-500">{formatCurrency(Number(s.price || 0))}</p>
                </div>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => addPredefinedService(s)}
                  leftIcon={<Plus className="w-3 h-3" />}
                  className="group-hover:border-brand-500 group-hover:text-brand-600"
                >
                  Add
                </Button>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-6 text-xs text-gray-400">
                No matching clinic services. Use the custom service form above.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Performed Services for this Visit */}
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-600" /> Performed Services ({services.length})
          </h3>
          <span className="text-[10px] text-gray-400">Recorded on Visit Report & Sales</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
          {services.map((item, index) => (
            <div
              key={index}
              className="p-4 bg-white border border-gray-200/80 rounded-xl shadow-sm space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-gray-900 flex-1">{item.name}</span>
                <button
                  type="button"
                  onClick={() => removeService(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Description / clinical observations..."
                    value={item.description}
                    onChange={(e) => updateServiceDesc(index, e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">
                    <DollarSign className="w-3 h-3" />
                  </span>
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => updateServicePrice(index, Number(e.target.value))}
                    className="w-full pl-6 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono font-bold text-gray-800 focus:ring-1 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>
            </div>
          ))}

          {services.length === 0 && (
            <div className="h-48 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <Stethoscope className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-xs font-medium">No additional services or procedures added yet.</p>
              <p className="text-[10px] text-gray-400 mt-1">Select from the menu on the left or add a custom service.</p>
            </div>
          )}
        </div>

        {/* Footer Total */}
        <div className="pt-4 mt-4 border-t border-gray-200 shrink-0 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Services Subtotal</span>
          <span className="text-base font-black font-mono text-brand-600">
            {formatCurrency(totalServicesValue)}
          </span>
        </div>
      </div>
    </div>
  );
}
