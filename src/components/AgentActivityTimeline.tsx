'use client';
import { useEffect, useMemo, useState } from 'react';

interface TimelineData {
  buckets: number[];
}

function formatBucketTime(index: number, total: number): string {
  // index 0 = 24h ago, index total-1 = now
  const nowMs = Date.now();
  const windowMs = 24 * 60 * 60 * 1000;
  const minuteMs = 60 * 1000;
  const offsetFromNow = (total - 1 - index) * minuteMs;
  const ts = nowMs - offsetFromNow;
  const d = new Date(ts);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

export function AgentActivityTimeline({ agentId, color = '#6366f1' }: { agentId: string; color?: string }) {
  const [data, setData] = useState<TimelineData | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/agents/activity/timeline?agentId=${encodeURIComponent(agentId)}`)
      .then((r) => r.json())
      .then((d: TimelineData) => { if (!cancelled) setData(d); })
      .catch(() => {/* ignore */});
    return () => { cancelled = true; };
  }, [agentId]);

  // Group 1440 1-min buckets into 288 5-min groups for display
  const groups = useMemo(() => {
    if (!data) return [];
    const raw = data.buckets;
    const GROUP_SIZE = 5;
    const result: { active: boolean; startIdx: number }[] = [];
    for (let i = 0; i < raw.length; i += GROUP_SIZE) {
      const slice = raw.slice(i, i + GROUP_SIZE);
      result.push({ active: slice.some((v) => v > 0), startIdx: i });
    }
    return result;
  }, [data]);

  const height = 32;
  const barW = 2;
  const gap = 0.5;
  const total = groups.length; // 288
  const svgWidth = total * (barW + gap);

  if (!data) {
    return (
      <div className="w-full mt-3" style={{ height: `${height}px` }}>
        <div className="w-full h-full bg-slate-800/30 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="relative w-full mt-3" style={{ height: `${height}px` }}>
      <svg
        viewBox={`0 0 ${svgWidth} ${height}`}
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        {groups.map((g, i) => {
          const x = i * (barW + gap);
          return (
            <rect
              key={i}
              x={x}
              y={0}
              width={barW}
              height={height}
              rx={0.3}
              fill={g.active ? color : 'rgba(100,116,139,0.12)'}
              onMouseEnter={(e) => {
                const svgEl = (e.currentTarget as SVGElement).closest('svg');
                const rect = svgEl?.parentElement?.getBoundingClientRect();
                if (rect) {
                  const label = formatBucketTime(g.startIdx, 1440);
                  setTooltip({
                    x: rect.left + (i + 0.5) * (rect.width / total),
                    y: rect.top,
                    label,
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
          className="fixed z-50 pointer-events-none bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-slate-200 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -120%)',
          }}
        >
          {tooltip.label}
        </div>
      )}
    </div>
  );
}
