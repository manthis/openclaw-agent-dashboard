import { NextResponse } from 'next/server';
import { getMetricsStore, RETENTION_MS } from '@/lib/metrics/timeseriesStore';

export const runtime = 'nodejs';

function parseWindowMs(window: string | null): number | null {
  if (!window) return null;
  if (window === '15m') return 15 * 60 * 1000;
  if (window === '1h') return 60 * 60 * 1000;
  if (window === '24h') return 24 * 60 * 60 * 1000;
  return null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  const windowParam = url.searchParams.get('window');
  const startParam = url.searchParams.get('start');
  const endParam = url.searchParams.get('end');

  const now = Date.now();

  let startMs: number;
  let endMs: number;

  const windowMs = parseWindowMs(windowParam);

  if (startParam || endParam) {
    startMs = startParam ? Number(startParam) : now - RETENTION_MS;
    endMs = endParam ? Number(endParam) : now;
  } else if (windowMs) {
    startMs = now - windowMs;
    endMs = now;
  } else {
    // default window
    startMs = now - 15 * 60 * 1000;
    endMs = now;
  }

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs > endMs) {
    return NextResponse.json({ error: 'Invalid range' }, { status: 400 });
  }

  // Clamp to retention.
  const minStart = now - RETENTION_MS;
  if (startMs < minStart) startMs = minStart;
  if (endMs > now) endMs = now;

  const store = getMetricsStore();
  const points = store.getPointsInRange(startMs, endMs);

  return NextResponse.json({
    start: startMs,
    end: endMs,
    points,
  });
}
