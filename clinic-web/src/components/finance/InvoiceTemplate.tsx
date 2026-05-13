import { forwardRef } from 'react';
import { formatDate, formatCurrency } from '@/utils/format';
import { useInvoiceSettings } from '@/hooks/useFinance';
import { useClinicSettings } from '@/hooks/useSettings';

interface Props {
  appointment: any;
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, Props>(({ appointment }, ref) => {
  const { data: invoiceSettings } = useInvoiceSettings();
  const { data: clinicSettings } = useClinicSettings();

  if (!appointment) return null;

  const settings = invoiceSettings || {};
  const clinic = clinicSettings || {};

  const headerColor = settings.header_color || '#0ea5e9';
  const textColor = settings.text_color || '#111827';
  const font = settings.font_family || 'Inter';
  const direction = settings.direction || 'ltr';

  const total = Number(appointment.priceCharged || 0);
  const discount = (total * Number(appointment.discountPct || 0)) / 100;
  const finalAmount = total - discount;

  return (
    <div 
      ref={ref} 
      className="p-12 bg-white min-h-[297mm] w-[210mm] mx-auto print:m-0 print:shadow-none"
      style={{ fontFamily: font, direction: direction as any, color: textColor }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-12 border-b-4 pb-8" style={{ borderColor: headerColor }}>
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter" style={{ color: headerColor }}>
            {settings.clinic_name || clinic.clinic_name || 'Tashgheel Clinic'}
          </h1>
          <div className="mt-4 space-y-1 text-sm font-medium opacity-70">
            <p>{settings.contact_address || clinic.clinic_address}</p>
            <p>{settings.contact_phone || clinic.clinic_phone} · {settings.contact_email || clinic.clinic_email}</p>
            {settings.tax_number && <p>Tax ID: {settings.tax_number}</p>}
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-6xl font-black text-gray-100 uppercase mb-4">Invoice</h2>
          <div className="space-y-1 text-sm font-bold">
            <p><span className="opacity-50 uppercase tracking-widest text-[10px]">Invoice No:</span> #{appointment.id}</p>
            <p><span className="opacity-50 uppercase tracking-widest text-[10px]">Date:</span> {formatDate(new Date())}</p>
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="grid grid-cols-2 gap-12 mb-16">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-40">Bill To Patient</h3>
          <p className="text-xl font-black">{appointment.patient?.fullName}</p>
          <p className="text-sm font-medium opacity-60">ID: {appointment.patient?.code}</p>
          <p className="text-sm font-medium opacity-60">{appointment.patient?.phone}</p>
        </div>
        <div className="text-right">
          <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-40">Medical Provider</h3>
          <p className="text-lg font-bold">Dr. {appointment.doctor?.fullName}</p>
          <p className="text-sm font-medium opacity-60">{appointment.doctor?.specialty?.name}</p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-16 border-collapse">
        <thead>
          <tr className="text-left border-b-2 border-gray-100">
            <th className="py-4 text-[10px] font-black uppercase tracking-widest opacity-40">Description</th>
            <th className="py-4 text-[10px] font-black uppercase tracking-widest opacity-40 text-center">Qty</th>
            <th className="py-4 text-[10px] font-black uppercase tracking-widest opacity-40 text-right">Price</th>
            <th className="py-4 text-[10px] font-black uppercase tracking-widest opacity-40 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          <tr>
            <td className="py-6">
              <p className="font-bold text-lg">{appointment.service?.name}</p>
              <p className="text-xs opacity-50 font-medium">Medical Consultation / Session</p>
            </td>
            <td className="py-6 text-center font-bold">1</td>
            <td className="py-6 text-right font-bold">{formatCurrency(total)}</td>
            <td className="py-6 text-right font-black">{formatCurrency(total)}</td>
          </tr>
          {appointment.sessionItems?.map((item: any) => (
            <tr key={item.id}>
              <td className="py-4">
                <p className="font-bold">{item.product?.name}</p>
                <p className="text-[10px] opacity-50">Applied during session</p>
              </td>
              <td className="py-4 text-center font-bold">{item.quantity}</td>
              <td className="py-4 text-right font-bold">{formatCurrency(item.priceAtTime)}</td>
              <td className="py-4 text-right font-bold">{formatCurrency(item.quantity * item.priceAtTime)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div className="flex justify-end mb-20">
        <div className="w-80 space-y-4">
          <div className="flex justify-between text-sm font-bold">
            <span className="opacity-40 uppercase tracking-widest">Subtotal</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-red-600">
            <span className="opacity-40 uppercase tracking-widest">Discount ({appointment.discountPct}%)</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
          <div className="pt-4 border-t-2 border-gray-100 flex justify-between">
            <span className="text-lg font-black uppercase tracking-tighter">Grand Total</span>
            <span className="text-2xl font-black" style={{ color: headerColor }}>{formatCurrency(finalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-12 border-t border-gray-100 text-center">
        {settings.terms && (
          <div className="mb-8 text-left">
            <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-40">Terms & Conditions</h4>
            <p className="text-[10px] leading-relaxed opacity-60 font-medium whitespace-pre-wrap">
              {settings.terms}
            </p>
          </div>
        )}
        <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: headerColor }}>
          {settings.footer_note || 'Professional Medical Excellence'}
        </p>
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';
