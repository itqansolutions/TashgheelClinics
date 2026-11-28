import { useMemo, useState } from 'react';
import { formatCurrency, formatDate } from '@/utils/format';
import { Calendar } from 'lucide-react';
import { useT } from '@/i18n';

interface BarData {
  label: string;
  value: number;
}

export function SimpleBarChart({ data, height = 200 }: { data: BarData[], height?: number }) {
  const max = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);

  return (
    <div className="w-full flex items-end gap-6 px-4" style={{ height }}>
      {data.map((d, i) => {
        const h = (d.value / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center group">
            <div className="relative w-full flex justify-center h-full items-end">
              {/* Tooltip */}
              <div className="absolute -top-10 bg-gray-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-10 shadow-xl translate-y-2 group-hover:translate-y-0">
                {d.label}: {formatCurrency(d.value)}
              </div>
              {/* Bar */}
              <div 
                className="w-full max-w-[50px] bg-gradient-to-t from-brand-600 to-brand-400 rounded-t-2xl transition-all duration-700 ease-out group-hover:from-brand-500 group-hover:to-brand-300 shadow-xl shadow-brand-500/10"
                style={{ height: `${h}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-gray-400 font-black mt-4 truncate w-full text-center uppercase tracking-tighter">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function SimpleDonutChart({ data }: { data: { label: string, value: number, color: string }[] }) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);
  
  let cumulativePercent = 0;

  function getCoordinatesForPercent(percent: number) {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  }

  return (
    <div className="flex flex-col md:flex-row items-center gap-12">
      <div className="relative w-56 h-56">
        <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full filter drop-shadow-2xl">
          {data.map((d, i) => {
            const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
            const percent = total > 0 ? d.value / total : 0;
            cumulativePercent += percent;
            const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
            const largeArcFlag = percent > 0.5 ? 1 : 0;
            const pathData = [
              `M ${startX} ${startY}`,
              `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
              `L 0 0`,
            ].join(' ');

            if (percent === 0 && total > 0) return null;
            return <path key={i} d={pathData} fill={d.color} className="hover:opacity-80 transition-all cursor-pointer hover:scale-105 origin-center" />;
          })}
          {/* Inner circle to make it a donut */}
          <circle cx="0" cy="0" r="0.65" fill="white" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-black text-gray-900 tracking-tighter">{total.toLocaleString()}</span>
          <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Total</span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-4 group cursor-default">
            <div className="w-4 h-4 rounded-lg shadow-sm group-hover:scale-110 transition-transform" style={{ backgroundColor: d.color }}></div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-gray-700 uppercase tracking-tight">{d.label}</span>
              <span className="text-[10px] text-gray-400 font-bold">{d.value.toLocaleString()} ({(total > 0 ? Math.round((d.value / total) * 100) : 0)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface CashFlowPoint {
  label: string;
  date: string;
  income: number;
  expense: number;
  incomeByCategory?: Record<string, number>;
  expenseByCategory?: Record<string, number>;
}

export function SimpleLineChart({ data, height = 200, selected, onSelect }: { data: CashFlowPoint[], height?: number, selected?: number | null, onSelect?: (i: number) => void }) {
  const t = useT();
  const [hovered, setHovered] = useState<number | null>(null);
  if (!data.length) return null;

  const catLabel = (c: string) => {
    const v = t(`cat.${c}`);
    return v === `cat.${c}` ? c : v;
  };

  const max = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);
  const width = 600;
  const padding = 40;

  const getX = (i: number) => {
    if (!width || isNaN(width) || data.length < 2) return (width || 600) / 2;
    return (i / (data.length - 1)) * (width - padding * 2) + padding;
  };
  const getY = (v: number) => {
    const val = Number(v) || 0;
    const maxVal = Number(max) || 100;
    const h = Number(height) || 300;
    return h - ((val / maxVal) * (h - padding * 2) + padding);
  };

  const incomePoints = data.length > 1
    ? data.map((d, i) => `${getX(i)},${getY(d.income)}`).join(' ')
    : `${getX(0)-1},${getY(data[0].income)} ${getX(0)+1},${getY(data[0].income)}`;

  const expensePoints = data.length > 1
    ? data.map((d, i) => `${getX(i)},${getY(d.expense)}`).join(' ')
    : `${getX(0)-1},${getY(data[0].expense)} ${getX(0)+1},${getY(data[0].expense)}`;

  // Area paths
  const incomeAreaPoints = data.length > 1
    ? `${incomePoints} ${getX(data.length - 1)},${height} ${getX(0)},${height}`
    : `${getX(0)-1},${height} ${getX(0)-1},${getY(data[0].income)} ${getX(0)+1},${getY(data[0].income)} ${getX(0)+1},${height}`;

  const expenseAreaPoints = data.length > 1
    ? `${expensePoints} ${getX(data.length - 1)},${height} ${getX(0)},${height}`
    : `${getX(0)-1},${height} ${getX(0)-1},${getY(data[0].expense)} ${getX(0)+1},${getY(data[0].expense)} ${getX(0)+1},${height}`;

  const colWidth = data.length > 1 ? (width - padding * 2) / (data.length - 1) : width;
  const active = hovered ?? (selected ?? null);
  const activeData = active != null ? data[active] : null;

  const tooltipFor = (d: CashFlowPoint) => (
    <div className="bg-gray-900 text-white rounded-2xl px-4 py-3 shadow-2xl text-start min-w-[190px] pointer-events-none">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 mb-2">{formatDate(d.date, 'dd MMM yyyy')}</p>
      <div className="mb-2">
        <p className="text-[10px] font-black text-sky-300 uppercase tracking-widest">{t('rep.income')}: {formatCurrency(d.income)}</p>
        {Object.entries(d.incomeByCategory || {}).map(([cat, amt]) => (
          <p key={cat} className="text-[10px] text-gray-300 font-semibold ps-2">{catLabel(cat)}: {formatCurrency(amt)}</p>
        ))}
      </div>
      <div>
        <p className="text-[10px] font-black text-red-300 uppercase tracking-widest">{t('rep.expenses')}: {formatCurrency(d.expense)}</p>
        {Object.entries(d.expenseByCategory || {}).map(([cat, amt]) => (
          <p key={cat} className="text-[10px] text-gray-300 font-semibold ps-2">{catLabel(cat)}: {formatCurrency(amt)}</p>
        ))}
      </div>
      <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mt-2 pt-2 border-t border-gray-700">
        {t('rep.net')}: {formatCurrency(d.income - d.expense)}
      </p>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(p => (
            <line
              key={p}
              x1={padding}
              y1={getY(max * p)}
              x2={width - padding}
              y2={getY(max * p)}
              stroke="#f8fafc"
              strokeWidth="2"
            />
          ))}

          {/* Area Fills */}
          <polygon points={incomeAreaPoints} fill="url(#incomeGradient)" />
          <polygon points={expenseAreaPoints} fill="url(#expenseGradient)" />

          {/* Income Line */}
          <polyline
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={incomePoints}
            className="filter drop-shadow-lg"
          />
          {/* Expense Line */}
          <polyline
            fill="none"
            stroke="#ef4444"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={expensePoints}
          />

          {/* Points */}
          {data.map((d, i) => (
            <g key={`pt-${i}`} className="pointer-events-none">
              <circle cx={getX(i)} cy={getY(d.income)} r={selected === i ? 7 : 5} fill="#0ea5e9" className="stroke-white stroke-2" />
              <circle cx={getX(i)} cy={getY(d.expense)} r={selected === i ? 7 : 5} fill="#ef4444" className="stroke-white stroke-2" />
            </g>
          ))}

          {/* Hover / click columns (one per point) */}
          {data.map((_, i) => (
            <rect
              key={`col-${i}`}
              x={data.length > 1 ? getX(i) - colWidth / 2 : 0}
              y={0}
              width={data.length > 1 ? colWidth : width}
              height={height}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect && onSelect(i)}
            />
          ))}
        </svg>

        {/* Rich HTML tooltip */}
        {activeData != null && active != null && (
          <div
            className="absolute z-20"
            style={{
              left: `${Math.min(Math.max((getX(active) / width) * 100, 12), 88)}%`,
              top: 0,
              transform: 'translateX(-50%)',
            }}
          >
            {tooltipFor(activeData)}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center px-4 mt-8 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 group">
            <div className="w-4 h-1.5 bg-[#0ea5e9] rounded-full shadow-sm group-hover:w-6 transition-all"></div>
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{t('rep.income')}</span>
          </div>
          <div className="flex items-center gap-2 group">
            <div className="w-4 h-1.5 bg-[#ef4444] rounded-full shadow-sm group-hover:w-6 transition-all"></div>
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{t('rep.expenses')}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-black uppercase tracking-widest">
          <Calendar className="w-3 h-3" />
          {data[0]?.label} - {data[data.length - 1]?.label}
        </div>
      </div>
      <p className="text-[10px] text-gray-400 font-semibold mt-3 text-center">{t('rep.hint')}</p>
    </div>
  );
}
