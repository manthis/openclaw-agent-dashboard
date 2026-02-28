import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentGraph } from '@/components/AgentGraph';
import type { Agent, AgentRelation } from '@/types/agent';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: any) => <div className={className}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

jest.mock('@/components/StatusBadge', () => ({
  StatusBadge: ({ status }: { status: string }) => <span>{status}</span>,
}));

jest.mock('@/components/AgentCard', () => ({
  AgentCard: ({ agent, onClose }: { agent: any; onClose?: () => void }) => (
    <div data-testid="agent-card">
      <span data-testid="card-name">{agent.name}</span>
      <button onClick={onClose} aria-label="Close card">x</button>
    </div>
  ),
}));

const mockAgents: Agent[] = [
  {
    id: 'mother',
    name: 'MOTHER',
    emoji: 'M',
    model: 'claude',
    workspace: '/tmp/mother',
    theme: 'neutral',
    avatar: null,
    status: 'idle',
    files: { soul: true, identity: true, tools: false, memory: false },
    relations: ['tars'],
  },
];

const mockRelations: AgentRelation[] = [
  { source: 'hal9000', target: 'mother', label: 'delegates' },
];

describe('AgentGraph', () => {
  it('renders agent-graph container', () => {
    render(<AgentGraph agents={mockAgents} relations={mockRelations} />);
    expect(screen.getByTestId('agent-graph')).toBeInTheDocument();
  });

  it('renders agent nodes', () => {
    render(<AgentGraph agents={mockAgents} relations={mockRelations} />);
    expect(screen.getByTestId('node-mother')).toBeInTheDocument();
  });

  it('shows agent card when node is clicked', () => {
    render(<AgentGraph agents={mockAgents} relations={mockRelations} />);
    fireEvent.click(screen.getByTestId('node-mother'));
    expect(screen.getByTestId('agent-card')).toBeInTheDocument();
    expect(screen.getByTestId('card-name')).toHaveTextContent('MOTHER');
  });

  it('hides card when close is clicked', () => {
    render(<AgentGraph agents={mockAgents} relations={mockRelations} />);
    fireEvent.click(screen.getByTestId('node-mother'));
    expect(screen.getByTestId('agent-card')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Close card'));
    expect(screen.queryByTestId('agent-card')).not.toBeInTheDocument();
  });
});
