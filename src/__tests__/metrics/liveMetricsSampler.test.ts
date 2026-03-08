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
