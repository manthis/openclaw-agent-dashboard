'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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

function normalizeToSvg(
  points: MetricsPoint[],
  width: number,
  height: number,
  valueKey: 'cpuPercent' | 'memPercent',
) {
  if (points.length === 0) return '';
  const minX = points[0].ts;
  const maxX = points[points.length - 1].ts;
  const dx = Math.max(1, maxX - minX);

  const coords = points.map((p) => {
    const x = ((p.ts - minX) / dx) * width;
    const value = Math.max(0, Math.min(100, p[valueKey]));
    const y = height - (value / 100) * height;
    return { x, y };
  });

  return buildPolyline(coords);
}

const WINDOW_MS: Record<WindowKey, number> = {
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
};

export function CpuMemHistorySection() {
  const [windowKey, setWindowKey] = useState<WindowKey>('15m');
  const [isLive, setIsLive] = useState(false);
  const [history, setHistory] = useState<MetricsPoint[]>([]);
  const [livePoints, setLivePoints] = useState<MetricsPoint[]>([]);

  // Polling mode: fetch timeseries every 5s when NOT live
  useEffect(() => {
    if (isLive) return;

    const load = async () => {
      try {
        const res = await fetch(`/api/metrics/timeseries?window=${windowKey}`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = (await res.json()) as ApiResponse;
        setHistory(data.points ?? []);
      } catch {}
    };

    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [windowKey, isLive]);

  // Reset live points on window change
  useEffect(() => {
    setLivePoints([]);
  }, [windowKey]);

  // SSE stream: only active when isLive
  const windowKeyRef = useRef(windowKey);
  windowKeyRef.current = windowKey;

  useEffect(() => {
    if (!isLive) return;

    const es = new EventSource('/api/metrics/stream');

    es.addEventListener('metrics', (ev) => {
      try {
        const snap = JSON.parse((ev as MessageEvent).data) as MetricsPoint & {
          gatewayConnected?: boolean;
          sessionsActive?: number;
        };
        const point: MetricsPoint = {
          ts: snap.ts,
          cpuPercent: snap.cpuPercent,
          memPercent: snap.memPercent,
          memUsed: snap.memUsed,
          memTotal: snap.memTotal,
        };
        const cutoff = Date.now() - WINDOW_MS[windowKeyRef.current];
        setLivePoints((prev) => [
          ...prev.filter((p) => p.ts >= cutoff),
          point,
        ]);
      } catch {}
    });

    return () => {
      es.close();
    };
  }, [isLive]);

  // Merge history + live, deduplicated, sorted by ts
  const points = useMemo(() => {
    const cutoff = Date.now() - WINDOW_MS[windowKey];
    const map = new Map<number, MetricsPoint>();
    const source = isLive ? livePoints : history;
    source
      .filter((p) => p.ts >= cutoff)
      .forEach((p) => map.set(p.ts, p));
    return Array.from(map.values()).sort((a, b) => a.ts - b.ts);
  }, [history, livePoints, windowKey, isLive]);

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

        <div className="flex items-center gap-2">
          {/* Window selector */}
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

          {/* Live toggle */}
          <button
            onClick={() => setIsLive((v) => !v)}
            className={
              'flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition ' +
              (isLive
                ? 'bg-green-50 dark:bg-green-950 border-green-400 dark:border-green-600 text-green-700 dark:text-green-400 font-semibold'
                : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800')
            }
          >
            {isLive ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                Live
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-600 inline-block" />
                5s
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-200">
              <Cpu className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span className="font-medium">CPU</span>
              <span className="text-gray-500 dark:text-slate-400">
                {last ? `${last.cpuPercent}%` : '—'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-200">
              <MemoryStick className="w-4 h-4 text-purple-500 dark:text-purple-400" />
              <span className="font-medium">Memory</span>
              <span className="text-gray-500 dark:text-slate-400">
                {last
                  ? `${last.memPercent}% (${
                      formatBytes(last.memUsed)
                    } / ${formatBytes(last.memTotal)})`
                  : '—'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full inline-block ${
                isLive ? 'animate-ping bg-green-400' : 'bg-gray-300 dark:bg-slate-600'
              }`}
            />
            <span className="text-xs text-gray-400 dark:text-slate-500">
              {points.length ? `${points.length} pts` : 'No data yet'}
            </span>
          </div>
        </div>

        <div className="w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full h-[200px] text-slate-700 dark:text-slate-300"
            role="img"
            aria-label="CPU and memory history chart"
          >
            {/* unit label */}
            <text
              x={6}
              y={14}
              fontSize={12}
              fill="currentColor"
              opacity={0.75}
            >
              CPU/Mem (%)
            </text>

            {/* grid + y-axis labels */}
            {[0, 25, 50, 75, 100].map((v) => {
              const y = svgH - (v / 100) * svgH;
              return (
                <g key={v}>
                  <line
                    x1={0}
                    y1={y}
                    x2={svgW}
                    y2={y}
                    stroke="currentColor"
                    opacity={0.12}
                  />
                  <text
                    x={6}
                    y={y - 4}
                    fontSize={12}
                    fill="currentColor"
                    opacity={0.7}
                  >
                    {v}%
                  </text>
                </g>
              );
            })}

            {/* CPU line — amber */}
            {cpuPolyline && (
              <polyline
                points={cpuPolyline}
                fill="none"
                stroke="rgb(245 158 11)"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}

            {/* Memory line — purple */}
            {memPolyline && (
              <polyline
                points={memPolyline}
                fill="none"
                stroke="rgb(168 85 247)"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={0.9}
              />
            )}
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-2 flex items-center gap-4 text-xs text-gray-400 dark:text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-amber-400 inline-block rounded" />
            CPU
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-purple-400 inline-block rounded" />
            Memory
          </span>
          <span className="ml-auto">
            {isLive ? 'Live · streaming' : 'Polling · 5s'}
          </span>
        </div>
      </div>
    </section>
  );
}
