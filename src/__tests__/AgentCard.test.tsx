import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentCard } from '@/components/AgentCard';
import type { Agent } from '@/types/agent';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: any) => <div className={className}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockAgent: Agent = {
  id: 'hal9000',
  name: 'HAL9000',
  emoji: '🔴',
  model: 'anthropic/claude-sonnet',
  workspace: '/tmp/hal9000',
  theme: 'Calm AI',
  avatar: null,
  status: 'idle',
  files: { soul: true, identity: true, tools: false, memory: false },
  relations: ['mother', 'tars'],
};

describe('AgentCard', () => {
  it('renders agent name', () => {
    render(<AgentCard agent={mockAgent} />);
    expect(screen.getByText('HAL9000')).toBeInTheDocument();
  });

  it('renders agent id', () => {
    render(<AgentCard agent={mockAgent} />);
    expect(screen.getByText('hal9000')).toBeInTheDocument();
  });

  it('renders model', () => {
    render(<AgentCard agent={mockAgent} />);
    expect(screen.getByText('anthropic/claude-sonnet')).toBeInTheDocument();
  });

  it('renders theme', () => {
    render(<AgentCard agent={mockAgent} />);
    expect(screen.getByText('Calm AI')).toBeInTheDocument();
  });

  it('renders SOUL.md badge', () => {
    render(<AgentCard agent={mockAgent} />);
    expect(screen.getByText('SOUL.md')).toBeInTheDocument();
  });

  it('renders relations', () => {
    render(<AgentCard agent={mockAgent} />);
    expect(screen.getByText('mother')).toBeInTheDocument();
    expect(screen.getByText('tars')).toBeInTheDocument();
  });

  it('calls onClose when button clicked', () => {
    const onClose = jest.fn();
    render(<AgentCard agent={mockAgent} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render close button without onClose', () => {
    render(<AgentCard agent={mockAgent} />);
    expect(screen.queryByLabelText('Close')).not.toBeInTheDocument();
  });
});
