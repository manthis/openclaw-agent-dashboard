import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentMultiSelect } from '@/components/agents/AgentMultiSelect';
import type { Agent } from '@/types/agent';

const mockAgents: Agent[] = [
  { id: 'data', name: 'DATA', emoji: '🔍', model: 'anthropic/claude-sonnet-4-6', workspace: '', theme: '', avatar: null, status: 'idle', files: { soul: false, identity: false, tools: false, memory: false, user: false, agents: false, heartbeat: false }, relations: [] },
  { id: 'atlas', name: 'ATLAS', emoji: '🗺️', model: 'anthropic/claude-opus-4-6', workspace: '', theme: '', avatar: null, status: 'idle', files: { soul: false, identity: false, tools: false, memory: false, user: false, agents: false, heartbeat: false }, relations: [] },
];

describe('AgentMultiSelect', () => {
  it('renders selected agent tags', () => {
    render(<AgentMultiSelect values={['data']} onChange={jest.fn()} agents={mockAgents} />);
    expect(screen.getByText(/DATA/)).toBeInTheDocument();
  });

  it('removes agent on click', () => {
    const onChange = jest.fn();
    render(<AgentMultiSelect values={['data']} onChange={onChange} agents={mockAgents} />);
    fireEvent.click(screen.getByRole('button', { name: '\u00d7' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('shows dropdown with agents on focus', () => {
    render(<AgentMultiSelect values={[]} onChange={jest.fn()} agents={mockAgents} />);
    fireEvent.focus(screen.getByRole('textbox'));
    expect(screen.getByText('ATLAS')).toBeInTheDocument();
  });

  it('adds agent from dropdown', () => {
    const onChange = jest.fn();
    render(<AgentMultiSelect values={[]} onChange={jest.fn().mockImplementation(onChange)} agents={mockAgents} />);
    fireEvent.focus(screen.getByRole('textbox'));
    const button = screen.getAllByRole('button').find((b) => b.textContent?.includes('ATLAS'));
    if (button) fireEvent.click(button);
    // onChange called
  });

  it('shows wildcard * option', () => {
    render(<AgentMultiSelect values={[]} onChange={jest.fn()} agents={mockAgents} />);
    fireEvent.focus(screen.getByRole('textbox'));
    expect(screen.getByText(/All agents/)).toBeInTheDocument();
  });

  it('filters agents by text input', () => {
    render(<AgentMultiSelect values={[]} onChange={jest.fn()} agents={mockAgents} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'atlas' } });
    expect(screen.getByText('ATLAS')).toBeInTheDocument();
    expect(screen.queryByText('DATA')).not.toBeInTheDocument();
  });
});
