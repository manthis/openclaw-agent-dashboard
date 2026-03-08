import { execSync } from 'child_process';
import { getSystemSnapshot } from '@/lib/systemSnapshot';

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

export type LiveMetricsDeps = {
  now?: () => number;
  getGatewayConnected?: () => Promise<boolean>;
  getSessionsActive5m?: () => Promise<number>;
  getSystemSnapshot?: typeof getSystemSnapshot;
};

const DEFAULT_GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789';

async function defaultGetGatewayConnected() {
  try {
    const out = execSync('openclaw gateway status --json 2>/dev/null', { timeout: 5000 }).toString();
    const parsed = JSON.parse(out.trim()) as { rpc?: { ok?: boolean } };
    return Boolean(parsed?.rpc?.ok);
  } catch {
    try {
      const res = await fetch(DEFAULT_GATEWAY_URL, { method: 'GET', signal: AbortSignal.timeout(2000) });
      return res.ok;
    } catch {
      return false;
    }
  }
}

async function defaultGetSessionsActive5m() {
  try {
    const output = execSync('openclaw sessions --active 5 --json 2>/dev/null || echo "[]"', { timeout: 5000 }).toString();
    const parsed = JSON.parse(output.trim());
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export async function sampleLiveMetrics(deps: LiveMetricsDeps = {}): Promise<LiveMetricsSnapshot> {
  const now = deps.now ?? (() => Date.now());
  const getGatewayConnected = deps.getGatewayConnected ?? defaultGetGatewayConnected;
  const getSessionsActive5m = deps.getSessionsActive5m ?? defaultGetSessionsActive5m;
  const getSnapshot = deps.getSystemSnapshot ?? getSystemSnapshot;

  const [gatewayConnected, sessionsActive5m] = await Promise.all([
    getGatewayConnected(),
    getSessionsActive5m(),
  ]);

  const snapshot = getSnapshot();

  return {
    gatewayConnected,
    sessionsActive5m,
    cpuPercent: snapshot.cpu.percent,
    loadAvg: snapshot.cpu.loadAvg,
    memUsed: snapshot.memory.used,
    memTotal: snapshot.memory.total,
    memPercent: snapshot.memory.percent,
    ts: now(),
  };
}

type Listener = (snap: LiveMetricsSnapshot) => void;

export class LiveMetricsSampler {
  private deps: LiveMetricsDeps;
  private listeners = new Set<Listener>();
  private timer: NodeJS.Timeout | null = null;
  private _last: LiveMetricsSnapshot | null = null;
  private running = false;
  private inFlight = false;

  constructor(deps: LiveMetricsDeps = {}) {
    this.deps = deps;
  }

  get last() {
    return this._last;
  }

  start(intervalMs = 5000) {
    if (this.running) return;
    this.running = true;

    // Prime quickly.
    void this.sampleOnce();

    this.timer = setInterval(() => {
      void this.sampleOnce();
    }, intervalMs);

    // Don't keep the process alive just for metrics.
    // (Next.js will keep the route alive as needed.)
    (this.timer as any).unref?.();
  }

  stop() {
    this.running = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async sampleOnce() {
    if (this.inFlight) return this._last;
    this.inFlight = true;
    try {
      const snap = await sampleLiveMetrics(this.deps);
      this._last = snap;
      for (const l of this.listeners) l(snap);
      return snap;
    } finally {
      this.inFlight = false;
    }
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    if (this._last) listener(this._last);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __liveMetricsSampler: LiveMetricsSampler | undefined;
}

export function getLiveMetricsSampler() {
  if (!global.__liveMetricsSampler) {
    global.__liveMetricsSampler = new LiveMetricsSampler();
    global.__liveMetricsSampler.start(5000);
  }
  return global.__liveMetricsSampler;
}
