import React from 'react';
import { render, screen } from '@testing-library/react';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));

import { MobileDashboard } from '@/components/MobileDashboard';
import type { Agent, AgentRelation } from '@/types/agent';

const makeAgent = (overrides: Partial<Agent> = {}): Agent => ({
  id: 'a1',
  name: 'TestAgent',
  emoji: '🤖',
  status: 'idle',
  model: 'gpt-4',
  description: '',
  prompt: '',
  toolsEnabled: [],
  ...overrides,
} as Agent);

describe('MobileDashboard', () => {
  it('shows empty state when no agents', () => {
    render(<MobileDashboard agents={[]} relations={[]} />);
    expect(screen.getByText(/no agents found/i)).toBeInTheDocument();
  });

  it('renders agents in SVG', () => {
    const agents = [makeAgent({ id: 'a1', name: 'Alpha' }), makeAgent({ id: 'a2', name: 'Beta' })];
    render(<MobileDashboard agents={agents} relations={[]} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('renders with relations', () => {
    const agents = [makeAgent({ id: 'a1', name: 'Alpha' }), makeAgent({ id: 'a2', name: 'Beta' })];
    const relations: AgentRelation[] = [{ source: 'a1', target: 'a2' }];
    const { container } = render(<MobileDashboard agents={agents} relations={relations} />);
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBeGreaterThan(0);
  });

  it('renders active agent with neon ring circles', () => {
    const agents = [makeAgent({ id: 'a1', name: 'Active', status: 'active' })];
    const { container } = render(<MobileDashboard agents={agents} relations={[]} />);
    // Active agent has: 1 avatar circle + 2 ring circles = 3+
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThanOrEqual(3);
  });

  it('navigates on agent click', () => {
    const agents = [makeAgent({ id: 'a1', name: 'Alpha' })]
    render(<MobileDashboard agents={agents} relations={[]} />);
    screen.getByText('Alpha').closest('g')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(mockPush).toHaveBeenCalledWith('/agents?open=a1');
  });

  it('renders active+active connection as animated line', () => {
    const agents = [
      makeAgent({ id: 'a1', name: 'A', status: 'active' }),
      makeAgent({ id: 'a2', name: 'B', status: 'active' }),
    ];
    const relations: AgentRelation[] = [{ source: 'a1', target: 'a2' }];
    const { container } = render(<MobileDashboard agents={agents} relations={relations} />);
    // Active connection line has animate child
    const animates = container.querySelectorAll('animate');
    expect(animates.length).toBeGreaterThan(0);
  });
});
