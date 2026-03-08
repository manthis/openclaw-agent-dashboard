import { pruneByRetention, shouldAppendPoint, type MetricsPoint } from '@/lib/metrics/timeseriesStore';

describe('metrics timeseries store helpers', () => {
  test('pruneByRetention removes points older than retention', () => {
    const now = 1_000_000;
    const retention = 1000;
    const points: MetricsPoint[] = [
      { ts: now - 5000, cpuPercent: 1, memPercent: 1, memUsed: 1, memTotal: 1 },
      { ts: now - 1500, cpuPercent: 2, memPercent: 2, memUsed: 2, memTotal: 2 },
      { ts: now - 999, cpuPercent: 3, memPercent: 3, memUsed: 3, memTotal: 3 },
      { ts: now - 10, cpuPercent: 4, memPercent: 4, memUsed: 4, memTotal: 4 },
    ];

    const pruned = pruneByRetention(points, now, retention);
    expect(pruned.map((p) => p.ts)).toEqual([now - 999, now - 10]);
  });

  test('shouldAppendPoint downsample logic', () => {
    const last: MetricsPoint = { ts: 1000, cpuPercent: 1, memPercent: 1, memUsed: 1, memTotal: 1 };

    expect(shouldAppendPoint(last, 1000)).toBe(false);
    expect(shouldAppendPoint(last, 10_999, 10_000)).toBe(false);
    expect(shouldAppendPoint(last, 11_000, 10_000)).toBe(true);
  });
});
