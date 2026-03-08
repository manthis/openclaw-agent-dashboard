import { execSync } from 'child_process';

// Helper: replicate the sessions-parsing logic from route.ts
function parseSessionsCount(parsed: unknown): number {
  if (Array.isArray(parsed)) return parsed.length;
  if (parsed && typeof parsed === 'object' && typeof (parsed as any).count === 'number')
    return (parsed as any).count;
  if (parsed && Array.isArray((parsed as any).sessions))
    return (parsed as any).sessions.length;
  return 0;
}

describe('/api/system sessions parsing logic', () => {
  test('object with count field → returns count', () => {
    const parsed = { count: 4, sessions: [{}, {}, {}, {}], path: '/tmp', activeMinutes: 5 };
    expect(parseSessionsCount(parsed)).toBe(4);
  });

  test('object with only sessions array → returns sessions.length', () => {
    const parsed = { sessions: [{}, {}] };
    expect(parseSessionsCount(parsed)).toBe(2);
  });

  test('legacy array response → returns array length', () => {
    const parsed = [{}, {}, {}];
    expect(parseSessionsCount(parsed)).toBe(3);
  });

  test('empty array → returns 0', () => {
    expect(parseSessionsCount([])).toBe(0);
  });

  test('null/unexpected → returns 0', () => {
    expect(parseSessionsCount(null)).toBe(0);
    expect(parseSessionsCount('bad')).toBe(0);
    expect(parseSessionsCount(42)).toBe(0);
  });

  test('count:0 is returned correctly (not masked)', () => {
    const parsed = { count: 0, sessions: [], activeMinutes: 5 };
    expect(parseSessionsCount(parsed)).toBe(0);
  });
});
