import { useMemo } from 'react';

interface BarData {
  label: string;
  value: number;
}

export function SimpleBarChart({ data, height = 200 }: { data: BarData[], height?: number }) {
  const max = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);

  return (
    <div className="w-full flex items-end gap-4 px-4" style={{ height }}>
      {data.map((d, i) => {
        const h = (d.value / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center group">
            <div className="relative w-full flex justify-center">
              {/* Tooltip */}
              <div className="absolute -top-10 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {d.label}: {d.value}
              </div>
              {/* Bar */}
              <div 
                className="w-full max-w-[40px] bg-brand-500 rounded-t-lg transition-all duration-700 ease-out hover:bg-brand-600 shadow-lg shadow-brand-500/20"
                style={{ height: `${h}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-gray-400 font-bold mt-2 truncate w-full text-center">{d.label}</span>
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
    <div className="flex flex-col md:flex-row items-center gap-8">
      <div className="relative w-48 h-48">
        <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full">
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
            return <path key={i} d={pathData} fill={d.color} className="hover:opacity-80 transition-opacity cursor-pointer" />;
          })}
          {/* Inner circle to make it a donut */}
          <circle cx="0" cy="0" r="0.6" fill="white" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-gray-900">{total}</span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-700">{d.label}</span>
              <span className="text-[10px] text-gray-400">{d.value} ({Math.round((d.value / total) * 100)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SimpleLineChart({ data, height = 200 }: { data: any[], height?: number }) {
  if (!data.length) return null;

  const max = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);
  const width = 500;
  const padding = 20;
  
  const getX = (i: number) => (i / (data.length - 1)) * (width - padding * 2) + padding;
  const getY = (v: number) => height - ((v / max) * (height - padding * 2) + padding);

  const incomePoints = data.map((d, i) => `${getX(i)},${getY(d.income)}`).join(' ');
  const expensePoints = data.map((d, i) => `${getX(i)},${getY(d.expense)}`).join(' ');

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(p => (
            <line 
              key={p} 
              x1={padding} 
              y1={getY(max * p)} 
              x2={width - padding} 
              y2={getY(max * p)} 
              stroke="#f1f5f9" 
              strokeWidth="1" 
            />
          ))}

          {/* Income Line */}
          <polyline
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={incomePoints}
            className="drop-shadow-lg"
          />
          {/* Expense Line */}
          <polyline
            fill="none"
            stroke="#ef4444"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={expensePoints}
            className="drop-shadow-lg opacity-60"
          />

          {/* Data Points */}
          {data.map((d, i) => (
            <g key={i} className="group cursor-pointer">
              <circle cx={getX(i)} cy={getY(d.income)} r="4" fill="#0ea5e9" className="hover:r-6 transition-all" />
              <circle cx={getX(i)} cy={getY(d.expense)} r="4" fill="#ef4444" className="hover:r-6 transition-all" />
            </g>
          ))}
        </svg>
      </div>
      <div className="flex justify-between px-2 mt-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-[#0ea5e9] rounded-full"></div>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-[#ef4444] rounded-full opacity-60"></div>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Expense</span>
          </div>
        </div>
        <div className="text-[10px] text-gray-400 font-bold">
          {data[0]?.label} — {data[data.length - 1]?.label}
        </div>
      </div>
    </div>
  );
}

