'use client';
import { useMemo, useState } from 'react';

interface DataPoint {
  date: string;
  count: number;
}

export function ActivitySparkline({ data }: { data: DataPoint[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: DataPoint } | null>(null);

  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const width = 100;
  const height = 32;
  const barCount = safeData.length;
  const barWidth = barCount > 0 ? width / barCount : width;
  const gap = 1;
  const maxCount = barCount > 0 ? Math.max(...safeData.map((d) => d.count), 1) : 1;

  return (
    <div className="relative w-full mt-3" style={{ height: `${height}px` }}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-full">
        {safeData.map((d, i) => {
          const barH = d.count === 0 ? 1 : Math.max(2, (d.count / maxCount) * (height - 2));
          const x = i * barWidth + gap / 2;
          const w = Math.max(0, barWidth - gap);
          const y = height - barH;
          const isActive = d.count > 0;
          return (
            <rect
              key={d.date}
              x={x}
              y={y}
              width={w}
              height={barH}
              rx={0.5}
              className={isActive ? 'fill-indigo-500' : 'fill-slate-700'}
              onMouseEnter={(e) => {
                const svgEl = (e.currentTarget as SVGElement).closest('svg');
                const rect = svgEl?.parentElement?.getBoundingClientRect();
                if (rect && barCount > 0) {
                  setTooltip({
                    x: rect.left + (i + 0.5) * (rect.width / barCount),
                    y: rect.top,
                    point: d,
                  });
                }
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          );
        })}
      </svg>
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-slate-800 border border-slate-600 text-slate-200 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -120%)',
          }}
        >
          <div className="font-mono">{tooltip.point.date}</div>
          <div>{tooltip.point.count} events</div>
        </div>
      )}
    </div>
  );
}
