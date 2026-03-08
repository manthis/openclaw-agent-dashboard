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

const WINDOW_MS: Record<WindowKey, number> = {
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
};

function formatBytes(bytes: number) {
  return (bytes / (1024 ** 3)).toFixed(1) + ' GB';
}

function buildPolyline(points: { x: number; y: number }[]) {
  return points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

/**
 * Map points onto SVG coordinates.
 * X axis is ALWAYS anchored: [now - windowMs, now] → [0, svgW]
 * so new points enter from the right and old ones slide left.
 */
function normalizeToSvg(
  points: MetricsPoint[],
  width: number,
  height: number,
  valueKey: 'cpuPercent' | 'memPercent',
  windowMs: number,
  now: number,
) {
  if (points.length === 0) return '';
  const windowStart = now - windowMs;

  const coords = points.map((p) => {
    const x = ((p.ts - windowStart) / windowMs) * width;
    const value = Math.max(0, Math.min(100, p[valueKey]));
    const y = height - (value / 100) * height;
    return { x, y };
  });

  return buildPolyline(coords);
}

function formatTimeLabel(ts: number, windowMs: number): string {
  const d = new Date(ts);
  if (windowMs <= 15 * 60 * 1000) {
    // 15m → show minutes ago
    const ago = Math.round((Date.now() - ts) / 60000);
    return ago === 0 ? 'now' : `-${ago}m`;
  }
  if (windowMs <= 60 * 60 * 1000) {
    // 1h → HH:MM
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  // 24h → HH:MM
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function CpuMemHistorySection() {
  const [windowKey, setWindowKey] = useState<WindowKey>('15m');
  const [isLive, setIsLive] = useState(false);
  const [history, setHistory] = useState<MetricsPoint[]>([]);
  const [livePoints, setLivePoints] = useState<MetricsPoint[]>([]);
  const [now, setNow] = useState(() => Date.now());

  // Tick "now" every second so X axis scrolls smoothly
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const windowMs = WINDOW_MS[windowKey];

  // Load history on window change
  useEffect(() => {
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
    setLivePoints([]);
  }, [windowKey]);

  // Polling mode (default: every 5s)
  useEffect(() => {
    if (isLive) return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/metrics/timeseries?window=${windowKey}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as ApiResponse;
        setHistory(data.points ?? []);
      } catch {}
    }, 5000);
    return () => clearInterval(t);
  }, [isLive, windowKey]);

  // SSE live mode
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
        setLivePoints((prev) => [...prev.filter((p) => p.ts >= cutoff), point]);
      } catch {}
    });
    return () => es.close();
  }, [isLive]);

  // Merge + deduplicate
  const points = useMemo(() => {
    const cutoff = now - windowMs;
    const map = new Map<number, MetricsPoint>();
    [...history, ...livePoints]
      .filter((p) => p.ts >= cutoff)
      .forEach((p) => map.set(p.ts, p));
    return Array.from(map.values()).sort((a, b) => a.ts - b.ts);
  }, [history, livePoints, windowMs, now]);

  const last = points.length ? points[points.length - 1] : null;

  const svgW = 900;
  const svgH = 160;
  const PAD_LEFT = 38; // space for y-axis labels
  const chartW = svgW - PAD_LEFT;

  const cpuPolyline = useMemo(
    () => normalizeToSvg(points, chartW, svgH, 'cpuPercent', windowMs, now),
    [points, chartW, svgH, windowMs, now],
  );
  const memPolyline = useMemo(
    () => normalizeToSvg(points, chartW, svgH, 'memPercent', windowMs, now),
    [points, chartW, svgH, windowMs, now],
  );

  // X-axis time labels: 5 ticks across the window
  const xTicks = useMemo(() => {
    const ticks: { x: number; label: string }[] = [];
    const count = 5;
    for (let i = 0; i <= count; i++) {
      const frac = i / count;
      const ts = now - windowMs + frac * windowMs;
      const x = PAD_LEFT + frac * chartW;
      ticks.push({ x, label: formatTimeLabel(ts, windowMs) });
    }
    return ticks;
  }, [now, windowMs, PAD_LEFT, chartW]);

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
          CPU &amp; Memory History
        </h2>
        <div className="flex items-center gap-1">
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
          <button
            onClick={() => setIsLive((v) => !v)}
            className={
              'ml-1 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition font-medium ' +
              (isLive
                ? 'bg-green-500 border-green-400 text-white'
                : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300')
            }
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLive ? 'bg-white animate-ping' : 'bg-gray-400'
              }`}
            />
            {isLive ? 'Live' : '5s'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        {/* Stats header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-200">
              <Cpu className="w-4 h-4 text-amber-500" />
              <span className="font-medium">CPU</span>
              <span className="text-gray-500 dark:text-slate-400">{last ? `${last.cpuPercent}%` : '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-200">
              <MemoryStick className="w-4 h-4 text-purple-500" />
              <span className="font-medium">Memory</span>
              <span className="text-gray-500 dark:text-slate-400">
                {last ? `${last.memPercent}% (${formatBytes(last.memUsed)} / ${formatBytes(last.memTotal)})` : '—'}
              </span>
            </div>
          </div>
          <span className="text-xs text-gray-400 dark:text-slate-500">
            {points.length} pts
          </span>
        </div>

        {/* Chart */}
        <div className="w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${svgW} ${svgH + 24}`}
            className="w-full text-slate-700 dark:text-slate-300"
            style={{ height: 180 }}
          >
            {/* Y grid + labels */}
            {[0, 25, 50, 75, 100].map((v) => {
              const y = svgH - (v / 100) * svgH;
              return (
                <g key={v}>
                  <line x1={PAD_LEFT} y1={y} x2={svgW} y2={y} stroke="currentColor" opacity={0.1} />
                  <text x={PAD_LEFT - 4} y={y + 4} fontSize={11} fill="currentColor" opacity={0.65} textAnchor="end">
                    {v}%
                  </text>
                </g>
              );
            })}

            {/* Clip chart area */}
            <clipPath id="chartClip">
              <rect x={PAD_LEFT} y={0} width={chartW} height={svgH} />
            </clipPath>

            {/* CPU line */}
            {cpuPolyline && (
              <polyline
                points={cpuPolyline}
                fill="none"
                stroke="rgb(245 158 11)"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                clipPath="url(#chartClip)"
                transform={`translate(${PAD_LEFT}, 0)`}
              />
            )}

            {/* Memory line */}
            {memPolyline && (
              <polyline
                points={memPolyline}
                fill="none"
                stroke="rgb(168 85 247)"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                clipPath="url(#chartClip)"
                transform={`translate(${PAD_LEFT}, 0)`}
              />
            )}

            {/* X axis ticks */}
            {xTicks.map(({ x, label }, i) => (
              <text
                key={i}
                x={x}
                y={svgH + 16}
                fontSize={10}
                fill="currentColor"
                opacity={0.55}
                textAnchor="middle"
              >
                {label}
              </text>
            ))}
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-1 flex items-center gap-4 text-xs text-gray-400 dark:text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-amber-400 inline-block rounded" /> CPU
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-purple-400 inline-block rounded" /> Memory
          </span>
          <span className="ml-auto">{isLive ? 'Live · streaming' : 'Polling · 5s'}</span>
        </div>
      </div>
    </section>
  );
}
