'use client';
import { useMemo } from 'react';

interface Activity {
  timestamp: string | number | Date;
  [key: string]: unknown;
}

export function AgentActivityTimeline({ activities = [], agentId, color = '#6366f1' }: { activities?: Activity[]; agentId?: string; color?: string }) {
  const activeBuckets = useMemo(() => {
    const set = new Set<number>();
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const midnightMs = todayMidnight.getTime();
    for (const a of activities) {
      const ts = new Date(a.timestamp).getTime();
      const minutesSinceMidnight = (ts - midnightMs) / 60000;
      if (minutesSinceMidnight >= 0 && minutesSinceMidnight < 1440) {
        set.add(Math.floor(minutesSinceMidnight / 15));
      }
    }
    return set;
  }, [activities]);

  return (
    <div className="relative w-full mt-3">
      <svg width="100%" viewBox="0 0 96 60" preserveAspectRatio="none">
        {Array.from({ length: 96 }, (_, i) => (
          <rect key={`bg-${i}`} x={i} y={0} width={0.9} height={48} fill="rgba(99,102,241,0.1)" />
        ))}
        {Array.from({ length: 96 }, (_, i) =>
          activeBuckets.has(i) ? (
            <rect key={`active-${i}`} x={i} y={0} width={0.9} height={48} fill={color} rx={2} />
          ) : null
        )}
        <text x={0} y={58} textAnchor="start" fontSize={3} fill="rgba(99,102,241,0.5)">00h</text>
        <text x={24} y={58} textAnchor="middle" fontSize={3} fill="rgba(99,102,241,0.5)">06h</text>
        <text x={48} y={58} textAnchor="middle" fontSize={3} fill="rgba(99,102,241,0.5)">12h</text>
        <text x={72} y={58} textAnchor="middle" fontSize={3} fill="rgba(99,102,241,0.5)">18h</text>
        <text x={96} y={58} textAnchor="end" fontSize={3} fill="rgba(99,102,241,0.5)">24h</text>
      </svg>
    </div>
  );
}
