import 'server-only';

import fs from 'fs';
import path from 'path';
import { getSystemSnapshot } from '@/lib/systemSnapshot';

export type MetricsPoint = {
  ts: number; // epoch ms
  cpuPercent: number;
  memPercent: number;
  memUsed: number;
  memTotal: number;
};

export const SAMPLE_INTERVAL_MS = 10_000;
export const RETENTION_MS = 24 * 60 * 60 * 1000;

export function pruneByRetention(points: MetricsPoint[], now: number, retentionMs = RETENTION_MS): MetricsPoint[] {
  const cutoff = now - retentionMs;
  // points are time-ordered
  let i = 0;
  while (i < points.length && points[i].ts < cutoff) i++;
  return i === 0 ? points : points.slice(i);
}

export function shouldAppendPoint(last: MetricsPoint | undefined, ts: number, intervalMs = SAMPLE_INTERVAL_MS) {
  if (!last) return true;
  return ts - last.ts >= intervalMs;
}

function defaultPersistPath() {
  // Use /tmp for cheap persistence across Next restarts on dev machines.
  // If /tmp is not writable, fallback to user home.
  const candidate = '/tmp/openclaw-agent-dashboard-metrics.json';
  try {
    fs.mkdirSync(path.dirname(candidate), { recursive: true });
    fs.writeFileSync(candidate + '.probe', 'ok');
    fs.unlinkSync(candidate + '.probe');
    return candidate;
  } catch {
    const home = process.env.HOME || process.cwd();
    return path.join(home, '.openclaw', 'openclaw-agent-dashboard-metrics.json');
  }
}

export class MetricsTimeseriesStore {
  private points: MetricsPoint[] = [];
  private persistPath: string;
  private timer: NodeJS.Timeout | null = null;
  private lastPersistAt = 0;

  constructor(opts?: { persistPath?: string }) {
    this.persistPath = opts?.persistPath ?? defaultPersistPath();
    this.loadFromDisk();
  }

  start() {
    if (this.timer) return;
    // Prime immediately.
    this.sample();
    this.timer = setInterval(() => this.sample(), SAMPLE_INTERVAL_MS);
    // Don't keep the process alive just for metrics.
    this.timer.unref?.();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  getAllPoints() {
    return this.points;
  }

  getPointsInRange(startMs: number, endMs: number): MetricsPoint[] {
    // points sorted, do a linear filter (small array ~8640 max)
    return this.points.filter((p) => p.ts >= startMs && p.ts <= endMs);
  }

  sample(ts = Date.now()) {
    const snap = getSystemSnapshot();
    const point: MetricsPoint = {
      ts,
      cpuPercent: snap.cpu.percent,
      memPercent: snap.memory.percent,
      memUsed: snap.memory.used,
      memTotal: snap.memory.total,
    };

    const last = this.points[this.points.length - 1];
    if (shouldAppendPoint(last, ts)) {
      this.points = pruneByRetention([...this.points, point], ts);
    } else {
      // Downsample: replace last point within interval.
      this.points = pruneByRetention([...this.points.slice(0, -1), point], ts);
    }

    this.persistThrottled(ts);
    return point;
  }

  private persistThrottled(now: number) {
    if (now - this.lastPersistAt < 60_000) return;
    this.lastPersistAt = now;
    this.saveToDisk();
  }

  private loadFromDisk() {
    try {
      if (!fs.existsSync(this.persistPath)) return;
      const raw = fs.readFileSync(this.persistPath, 'utf8');
      const parsed = JSON.parse(raw) as { points?: MetricsPoint[] };
      if (!Array.isArray(parsed.points)) return;
      // Basic validation
      this.points = parsed.points
        .filter((p) => p && typeof p.ts === 'number')
        .sort((a, b) => a.ts - b.ts);
      this.points = pruneByRetention(this.points, Date.now());
    } catch {
      // ignore
    }
  }

  private saveToDisk() {
    try {
      fs.mkdirSync(path.dirname(this.persistPath), { recursive: true });
      fs.writeFileSync(this.persistPath, JSON.stringify({ points: this.points }), 'utf8');
    } catch {
      // ignore
    }
  }
}

// Global singleton across route handlers in the same Node process.
declare global {
  // eslint-disable-next-line no-var
  var __metricsTimeseriesStore: MetricsTimeseriesStore | undefined;
}

export function getMetricsStore() {
  if (!global.__metricsTimeseriesStore) {
    global.__metricsTimeseriesStore = new MetricsTimeseriesStore();
  }
  global.__metricsTimeseriesStore.start();
  return global.__metricsTimeseriesStore;
}
