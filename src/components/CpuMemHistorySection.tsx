'use client';

import { useEffect, useMemo, useState } from 'react';
import { Cpu, MemoryStick } from 'lucide-react';

type WindowKey = '15m' | '1h' | '24h';

type MetricsPoint = {
  ts: number;
  cpuPercent: number;
  memPercent: number;
  memUsed: number;
  memTotal: number;
};

type ApiResponse = {
  start: number;
  end: number;
  points: MetricsPoint[];
};

function formatBytes(bytes: number) {
  return (bytes / (1024 ** 3)).toFixed(1) + ' GB';
}

function buildPolyline(points: { x: number; y: number }[]) {
  return points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

function normalizeToSvg(points: MetricsPoint[], width: number, height: number, valueKey: 'cpuPercent' | 'memPercent') {
  if (points.length === 0) return '';
  const minX = points[0].ts;
  const maxX = points[points.length - 1].ts;
  const dx = Math.max(1, maxX - minX);

  const coords = points.map((p) => {
    const x = ((p.ts - minX) / dx) * width;
    const value = Math.max(0, Math.min(100, p[valueKey]));
    // y=0 top
    const y = height - (value / 100) * height;
    return { x, y };
  });

  return buildPolyline(coords);
}

export function CpuMemHistorySection() {
  const [windowKey, setWindowKey] = useState<WindowKey>('15m');
  const [data, setData] = useState<ApiResponse | null>(null);

  const fetchSeries = async () => {
    try {
      const res = await fetch(`/api/metrics/timeseries?window=${windowKey}`, { cache: 'no-store' });
      if (!res.ok) return;
      setData(await res.json());
    } catch {}
  };

  useEffect(() => {
    fetchSeries();
    const t = setInterval(fetchSeries, 10_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowKey]);

  const points = data?.points ?? [];

  const last = points.length ? points[points.length - 1] : null;

  const svgW = 900;
  const svgH = 200;

  const cpuPolyline = useMemo(() => normalizeToSvg(points, svgW, svgH, 'cpuPercent'), [points]);
  const memPolyline = useMemo(() => normalizeToSvg(points, svgW, svgH, 'memPercent'), [points]);

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
          CPU &amp; Memory History
        </h2>

        <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1">
          {(['15m', '1h', '24h'] as WindowKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setWindowKey(k)}
              className={
                'text-xs px-2 py-1 rounded-md transition ' +
                (k === windowKey
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800')
              }
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-200">
              <Cpu className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span className="font-medium">CPU</span>
              <span className="text-gray-500 dark:text-slate-400">{last ? `${last.cpuPercent}%` : '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-200">
              <MemoryStick className="w-4 h-4 text-purple-500 dark:text-purple-400" />
              <span className="font-medium">Memory</span>
              <span className="text-gray-500 dark:text-slate-400">
                {last ? `${last.memPercent}% (${formatBytes(last.memUsed)} / ${formatBytes(last.memTotal)})` : '—'}
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-400 dark:text-slate-500">
            {points.length ? `${points.length} points` : 'No data yet'}
          </div>
        </div>

        <div className="w-full overflow-hidden">
          <svg
            viewBox={`0 0  `}
            className="w-full h-[200px] text-slate-700 dark:text-slate-300"
            role="img"
            aria-label="CPU and memory history chart"
          >
            <text x={6} y={14} fontSize={12} fill="currentColor" opacity={0.75}>CPU/Mem (%)</text>
            {/* grid */}
            {[0, 25, 50, 75, 100].map((v) => {
              const y = svgH - (v / 100) * svgH;
              return (
                <g key={v}>
                  <line x1={0} y1={y} x2={svgW} y2={y} stroke="currentColor" opacity={0.12} />
                  <text x={6} y={y - 4} fontSize={12} fill="currentColor" opacity={0.7}>
                    {v}%
                  </text>
                </g>
              );
            })}

            {/* CPU */}
            {cpuPolyline && (
              <polyline
                points={cpuPolyline}
                fill="none"
                stroke="rgb(245 158 11)" // amber-500
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}

            {/* Memory */}
            {memPolyline && (
              <polyline
                points={memPolyline}
                fill="none"
                stroke="rgb(168 85 247)" // purple-500
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={0.9}
              />
            )}
          </svg>
        </div>

        <div className="mt-2 text-xs text-gray-400 dark:text-slate-500">
          Sampling every 10s, retained for 24h.
        </div>
      </div>
    </section>
  );
}
