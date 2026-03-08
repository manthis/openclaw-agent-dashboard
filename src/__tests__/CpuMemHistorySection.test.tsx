import React from 'react';
import { render, screen, act } from '@testing-library/react';

// Mock fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ points: [] }),
});

jest.mock('lucide-react', () => ({
  Cpu: () => React.createElement('span', null, 'cpu-icon'),
  MemoryStick: () => React.createElement('span', null, 'mem-icon'),
}));

// Mock EventSource
class MockEventSource {
  addEventListener = jest.fn();
  close = jest.fn();
}
(global as unknown as Record<string, unknown>).EventSource = MockEventSource;

import { CpuMemHistorySection } from '@/components/CpuMemHistorySection';

describe('CpuMemHistorySection', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ points: [
        { ts: Date.now(), cpuPercent: 42, memPercent: 55, memUsed: 8_000_000_000, memTotal: 16_000_000_000 }
      ] }),
    });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders section heading', async () => {
    await act(async () => { render(<CpuMemHistorySection />); });
    expect(screen.getByText(/CPU.*Memory History/i)).toBeInTheDocument();
  });

  it('renders time window buttons', async () => {
    await act(async () => { render(<CpuMemHistorySection />); });
    expect(screen.getByText('15m')).toBeInTheDocument();
    expect(screen.getByText('1h')).toBeInTheDocument();
    expect(screen.getByText('24h')).toBeInTheDocument();
  });

  it('renders SVG chart', async () => {
    let container: HTMLElement;
    await act(async () => {
      ({ container } = render(<CpuMemHistorySection />));
    });
    expect(container!.querySelector('svg')).toBeInTheDocument();
  });

  it('shows legend CPU and Memory labels', async () => {
    await act(async () => { render(<CpuMemHistorySection />); });
    expect(screen.getAllByText('CPU').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Memory').length).toBeGreaterThan(0);
  });

  it('clicking window button switches selection', async () => {
    await act(async () => { render(<CpuMemHistorySection />); });
    const btn1h = screen.getByText('1h');
    await act(async () => { btn1h.click(); });
    expect(btn1h.className).toContain('bg-indigo-600');
  });

  it('clicking Live button toggles live mode', async () => {
    await act(async () => { render(<CpuMemHistorySection />); });
    const liveBtn = screen.getByText('5s');
    await act(async () => { liveBtn.click(); });
    expect(screen.getByText('Live')).toBeInTheDocument();
  });
});
