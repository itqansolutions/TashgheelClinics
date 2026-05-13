import React from 'react';
import { formatCurrency, formatDate } from '@/utils/format';

interface Props {
  vendor: any;
  statement: {
    purchases: any[];
    payments: any[];
    balance: number;
    totalPurchases: number;
    totalPaid: number;
  };
  transactions: any[];
}

export const VendorStatementTemplate = React.forwardRef<HTMLDivElement, Props>(({ vendor, statement, transactions }, ref) => {
  return (
    <div ref={ref} className="p-12 bg-white text-black font-sans leading-relaxed">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-900 pb-8 mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Account Statement</h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Vendor Financial Record</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-black text-brand-600">{vendor.name}</h2>
          <p className="text-sm text-gray-500">{vendor.phone}</p>
          <p className="text-sm text-gray-500">{vendor.address}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6 mb-12">
        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Purchases</p>
          <p className="text-2xl font-mono font-black">{formatCurrency(statement.totalPurchases)}</p>
        </div>
        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Paid</p>
          <p className="text-2xl font-mono font-black">{formatCurrency(statement.totalPaid)}</p>
        </div>
        <div className="p-6 bg-brand-600 text-white rounded-2xl shadow-xl shadow-brand-100">
          <p className="text-[10px] font-black text-brand-100 uppercase tracking-widest mb-2">Outstanding Balance</p>
          <p className="text-2xl font-mono font-black">{formatCurrency(statement.balance)}</p>
        </div>
      </div>

      {/* Transactions Table */}
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
            <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
            <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reference</th>
            <th className="py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((t, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              <td className="py-4 text-sm font-medium text-gray-600">{formatDate(t.date)}</td>
              <td className="py-4 text-sm font-black text-gray-900">{t.type}</td>
              <td className="py-4 text-sm text-gray-500 font-mono">{t.reference}</td>
              <td className={`py-4 text-sm font-mono font-black text-right ${t.impact === 'positive' ? 'text-gray-900' : 'text-brand-600'}`}>
                {t.impact === 'positive' ? '+' : '-'}{formatCurrency(t.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div className="mt-20 pt-8 border-t border-gray-100 flex justify-between items-end">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Statement Generated On</p>
          <p className="text-sm font-bold">{formatDate(new Date(), 'dd MMM yyyy HH:mm')}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Authorized Signature</p>
          <div className="w-48 h-px bg-gray-900 mx-auto" />
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Powered by Tashgheel Clinic Management System</p>
      </div>
    </div>
  );
});

VendorStatementTemplate.displayName = 'VendorStatementTemplate';
