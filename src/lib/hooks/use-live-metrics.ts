'use client';

import { useEffect, useRef, useState } from 'react';

export type LiveMetricsSnapshot = {
  gatewayConnected: boolean;
  sessionsActive5m: number;
  cpuPercent: number;
  loadAvg: string;
  memUsed: number;
  memTotal: number;
  memPercent: number;
  ts: number;
};

type Options = {
  pollFallback?: () => Promise<LiveMetricsSnapshot | null>;
};

/**
 * Subscribes to /api/metrics/stream (SSE) and keeps the last snapshot in state.
 * Falls back to polling (every 5s) if SSE fails or is unsupported.
 */
export function useLiveMetrics(opts: Options = {}) {
  const [metrics, setMetrics] = useState<LiveMetricsSnapshot | null>(null);
  const startedFallback = useRef(false);

  const pollFallbackRef = useRef(opts.pollFallback);

  useEffect(() => {
    pollFallbackRef.current = opts.pollFallback;
  }, [opts.pollFallback]);

  useEffect(() => {
    let alive = true;
    let es: EventSource | null = null;
    let pollId: number | null = null;

    async function startPolling() {
      if (startedFallback.current) return;
      startedFallback.current = true;

      const poll = async () => {
        try {
          const snap = await pollFallbackRef.current?.();
          if (!alive) return;
          if (snap) setMetrics(snap);
        } catch {
          // ignore
        }
      };

      await poll();
      pollId = window.setInterval(poll, 5000);
    }

    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      void startPolling();
      return () => {
        alive = false;
        if (pollId) window.clearInterval(pollId);
      };
    }

    try {
      es = new EventSource('/api/metrics/stream');

      es.addEventListener('metrics', (e) => {
        try {
          const snap = JSON.parse((e as MessageEvent).data) as LiveMetricsSnapshot;
          if (!alive) return;
          setMetrics(snap);
        } catch {
          // ignore
        }
      });

      es.addEventListener('error', () => {
        // If the connection drops, fall back to polling.
        try {
          es?.close();
        } catch {
          // ignore
        }
        es = null;
        void startPolling();
      });
    } catch {
      void startPolling();
    }

    return () => {
      alive = false;
      try {
        es?.close();
      } catch {
        // ignore
      }
      if (pollId) window.clearInterval(pollId);
    };
  }, []);

  return metrics;
}
