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

const SSE_PATH = '/api/metrics/stream';
const BACKOFF_INITIAL = 1000;
const BACKOFF_MAX = 30_000;
const BACKOFF_FACTOR = 2;
const POLL_INTERVAL = 5000;

/**
 * Subscribes to /api/metrics/stream (SSE) with exponential-backoff auto-reconnect.
 * Falls back to polling (every 5s) if EventSource is unsupported.
 */
export function useLiveMetrics(opts: Options = {}) {
  const [metrics, setMetrics] = useState<LiveMetricsSnapshot | null>(null);
  const pollFallbackRef = useRef(opts.pollFallback);

  useEffect(() => {
    pollFallbackRef.current = opts.pollFallback;
  }, [opts.pollFallback]);

  useEffect(() => {
    // SSE not supported (old Safari, SSR) → poll
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      let alive = true;
      let pollId: ReturnType<typeof setInterval> | null = null;
      const poll = async () => {
        try {
          const snap = await pollFallbackRef.current?.();
          if (alive && snap) setMetrics(snap);
        } catch { /* ignore */ }
      };
      void poll();
      pollId = setInterval(() => void poll(), POLL_INTERVAL);
      return () => {
        alive = false;
        if (pollId) clearInterval(pollId);
      };
    }

    let alive = true;
    let es: EventSource | null = null;
    let backoff = BACKOFF_INITIAL;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      if (!alive) return;
      try {
        es = new EventSource(SSE_PATH);

        es.addEventListener('metrics', (e) => {
          try {
            const snap = JSON.parse((e as MessageEvent).data) as LiveMetricsSnapshot;
            if (!alive) return;
            setMetrics(snap);
            // Reset backoff on successful message
            backoff = BACKOFF_INITIAL;
          } catch { /* ignore */ }
        });

        es.addEventListener('error', () => {
          if (!alive) return;
          try { es?.close(); } catch { /* ignore */ }
          es = null;
          // Reconnect with exponential backoff
          reconnectTimer = setTimeout(() => {
            backoff = Math.min(backoff * BACKOFF_FACTOR, BACKOFF_MAX);
            connect();
          }, backoff);
        });

      } catch {
        // EventSource constructor threw (shouldn't happen)
        reconnectTimer = setTimeout(() => {
          backoff = Math.min(backoff * BACKOFF_FACTOR, BACKOFF_MAX);
          connect();
        }, backoff);
      }
    }

    connect();

    return () => {
      alive = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      try { es?.close(); } catch { /* ignore */ }
    };
  }, []);

  return metrics;
}
