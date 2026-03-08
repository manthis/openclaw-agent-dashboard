import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ModelMultiSelect } from '@/components/agents/ModelMultiSelect';

global.fetch = jest.fn().mockResolvedValue({
  json: () => Promise.resolve([
    { id: 'anthropic/claude-sonnet-4-6', alias: 'sonnet' },
    { id: 'anthropic/claude-haiku-4-5', alias: 'haiku' },
  ]),
}) as jest.Mock;

describe('ModelMultiSelect', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders existing tags', () => {
    render(<ModelMultiSelect values={['ollama/qwen3:4b']} onChange={jest.fn()} />);
    expect(screen.getByText('ollama/qwen3:4b')).toBeInTheDocument();
  });

  it('removes a tag on click', () => {
    const onChange = jest.fn();
    render(<ModelMultiSelect values={['ollama/qwen3:4b']} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: '\u00d7' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('shows dropdown on focus', async () => {
    render(<ModelMultiSelect values={[]} onChange={jest.fn()} />);
    fireEvent.focus(screen.getByRole('textbox'));
    await waitFor(() => {
      expect(screen.getByText('anthropic/claude-sonnet-4-6')).toBeInTheDocument();
    });
  });

  it('adds model from dropdown', async () => {
    const onChange = jest.fn();
    render(<ModelMultiSelect values={[]} onChange={onChange} />);
    fireEvent.focus(screen.getByRole('textbox'));
    await waitFor(() => screen.getByText('anthropic/claude-sonnet-4-6'));
    fireEvent.click(screen.getByText('anthropic/claude-sonnet-4-6'));
    expect(onChange).toHaveBeenCalledWith(['anthropic/claude-sonnet-4-6']);
  });

  it('adds typed value on Enter', () => {
    const onChange = jest.fn();
    render(<ModelMultiSelect values={[]} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'custom/model' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(['custom/model']);
  });

  it('removes last tag on Backspace', () => {
    const onChange = jest.fn();
    render(<ModelMultiSelect values={['a/b', 'c/d']} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(onChange).toHaveBeenCalledWith(['a/b']);
  });
});
