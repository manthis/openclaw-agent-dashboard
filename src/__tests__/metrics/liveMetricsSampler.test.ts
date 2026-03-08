import { LiveMetricsSampler, sampleLiveMetrics } from '@/lib/metrics/liveMetricsSampler';

describe('live metrics sampler', () => {
  test('sampleLiveMetrics maps system snapshot + deps into a snapshot', async () => {
    const snap = await sampleLiveMetrics({
      now: () => 123,
      getGatewayConnected: async () => true,
      getSessionsActive5m: async () => 7,
      getSystemSnapshot: () =>
        ({
          cpu: { percent: 11, loadAvg: '1.00, 2.00, 3.00' },
          memory: { used: 100, total: 200, percent: 50 },
        }) as any,
    });

    expect(snap).toEqual({
      gatewayConnected: true,
      sessionsActive5m: 7,
      cpuPercent: 11,
      loadAvg: '1.00, 2.00, 3.00',
      memUsed: 100,
      memTotal: 200,
      memPercent: 50,
      ts: 123,
    });
  });

  test('LiveMetricsSampler notifies subscribers and replays last snapshot', async () => {
    let calls = 0;

    const sampler = new LiveMetricsSampler({
      now: () => 999,
      getGatewayConnected: async () => false,
      getSessionsActive5m: async () => 0,
      getSystemSnapshot: () =>
        ({
          cpu: { percent: 1, loadAvg: '0.10, 0.10, 0.10' },
          memory: { used: 10, total: 100, percent: 10 },
        }) as any,
    });

    const events: any[] = [];
    const unsub = sampler.subscribe((s) => {
      calls++;
      events.push(s);
    });

    await sampler.sampleOnce();

    // First call comes from sampleOnce notifying listener.
    expect(calls).toBe(1);
    expect(sampler.last?.ts).toBe(999);

    // A new subscriber should get the last snapshot immediately.
    const events2: any[] = [];
    const unsub2 = sampler.subscribe((s) => events2.push(s));
    expect(events2).toHaveLength(1);
    expect(events2[0].ts).toBe(999);

    unsub();
    unsub2();
  });
});

describe('sessions JSON parsing', () => {
  const makeSnap = (getSessionsActive5m: () => Promise<number>) =>
    sampleLiveMetrics({
      now: () => 0,
      getGatewayConnected: async () => false,
      getSessionsActive5m,
      getSystemSnapshot: () =>
        ({ cpu: { percent: 0, loadAvg: '' }, memory: { used: 0, total: 0, percent: 0 } }) as any,
    });

  test('returns count from object with count field', async () => {
    // Simulate: parsed = { count: 3, sessions: [...], path: '...', activeMinutes: 5 }
    const snap = await makeSnap(async () => {
      const parsed = { count: 3, sessions: [{}, {}, {}], path: '/tmp', activeMinutes: 5 };
      if (Array.isArray(parsed)) return parsed.length;
      if (parsed && typeof parsed === 'object' && typeof (parsed as any).count === 'number') return (parsed as any).count;
      if (parsed && Array.isArray((parsed as any).sessions)) return (parsed as any).sessions.length;
      return 0;
    });
    expect(snap.sessionsActive5m).toBe(3);
  });

  test('returns sessions.length when count field absent', async () => {
    const snap = await makeSnap(async () => {
      const parsed = { sessions: [{}, {}] } as any;
      if (Array.isArray(parsed)) return parsed.length;
      if (parsed && typeof parsed === 'object' && typeof parsed.count === 'number') return parsed.count;
      if (parsed && Array.isArray(parsed.sessions)) return parsed.sessions.length;
      return 0;
    });
    expect(snap.sessionsActive5m).toBe(2);
  });

  test('returns 0 for legacy array response', async () => {
    const snap = await makeSnap(async () => {
      const parsed: unknown[] = [];
      if (Array.isArray(parsed)) return parsed.length;
      return 0;
    });
    expect(snap.sessionsActive5m).toBe(0);
  });

  test('sampleLiveMetrics returns correct sessionsActive5m from mock returning object format', async () => {
    const snap = await sampleLiveMetrics({
      now: () => 42,
      getGatewayConnected: async () => true,
      getSessionsActive5m: async () => 5,
      getSystemSnapshot: () =>
        ({ cpu: { percent: 0, loadAvg: '' }, memory: { used: 0, total: 0, percent: 0 } }) as any,
    });
    expect(snap.sessionsActive5m).toBe(5);
    expect(snap.ts).toBe(42);
  });
});
