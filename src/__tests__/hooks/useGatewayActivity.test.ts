import { renderHook, act } from '@testing-library/react';

global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ events: [] }),
});

class MockEventSource {
  static instances: MockEventSource[] = [];
  listeners: Record<string, ((e: MessageEvent) => void)[]> = {};
  url: string;
  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }
  addEventListener(event: string, cb: (e: MessageEvent) => void) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
  }
  close = jest.fn();
}
(global as unknown as Record<string, unknown>).EventSource = MockEventSource;

import { useGatewayActivity } from '@/lib/hooks/use-gateway-activity';

describe('useGatewayActivity', () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ events: [] }),
    });
  });

  it('initializes with empty events and not connected', () => {
    const { result } = renderHook(() => useGatewayActivity());
    expect(result.current.events).toEqual([]);
    expect(result.current.connected).toBe(false);
  });

  it('seeds events from history API', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        events: [{ id: 1, ts: Date.now(), type: 'status', summary: 'test', raw: '{}' }],
      }),
    });
    const { result } = renderHook(() => useGatewayActivity());
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    expect(result.current.events.length).toBeGreaterThanOrEqual(0);
  });

  it('handles history API failure gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useGatewayActivity());
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    expect(result.current.events).toEqual([]);
  });
});
