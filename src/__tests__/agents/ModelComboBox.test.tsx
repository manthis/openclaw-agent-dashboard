import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ModelComboBox } from '@/components/agents/ModelComboBox';

global.fetch = jest.fn().mockResolvedValue({
  json: () => Promise.resolve([
    { id: 'anthropic/claude-sonnet-4-6', alias: 'sonnet' },
    { id: 'ollama/qwen3:4b', alias: 'qwen' },
  ]),
}) as jest.Mock;

describe('ModelComboBox', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders input with current value', () => {
    render(<ModelComboBox value='anthropic/claude-sonnet-4-6' onChange={jest.fn()} />);
    expect(screen.getByDisplayValue('anthropic/claude-sonnet-4-6')).toBeInTheDocument();
  });

  it('calls onChange when typing', () => {
    const onChange = jest.fn();
    render(<ModelComboBox value='' onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'anthropic' } });
    expect(onChange).toHaveBeenCalledWith('anthropic');
  });

  it('shows dropdown on focus', async () => {
    render(<ModelComboBox value='' onChange={jest.fn()} />);
    fireEvent.focus(screen.getByRole('textbox'));
    await waitFor(() => {
      expect(screen.getByText('anthropic/claude-sonnet-4-6')).toBeInTheDocument();
    });
  });

  it('selects model on click', async () => {
    const onChange = jest.fn();
    render(<ModelComboBox value='' onChange={onChange} />);
    fireEvent.focus(screen.getByRole('textbox'));
    await waitFor(() => screen.getByText('anthropic/claude-sonnet-4-6'));
    fireEvent.click(screen.getByText('anthropic/claude-sonnet-4-6'));
    expect(onChange).toHaveBeenCalledWith('anthropic/claude-sonnet-4-6');
  });
});
