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
            const percent = d.value / total;
            cumulativePercent += percent;
            const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
            const largeArcFlag = percent > 0.5 ? 1 : 0;
            const pathData = [
              `M ${startX} ${startY}`,
              `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
              `L 0 0`,
            ].join(' ');

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
