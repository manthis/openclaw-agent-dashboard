import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PasswordField } from '@/components/config/PasswordField';

describe('PasswordField', () => {
  it('renders the label', () => {
    render(<PasswordField label="API Key" value="" onChange={jest.fn()} />);
    expect(screen.getByText('API Key')).toBeInTheDocument();
  });

  it('renders input as password type by default', () => {
    render(<PasswordField label="Secret" value="abc" onChange={jest.fn()} />);
    const input = screen.getByDisplayValue('abc');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('toggles to text type on button click', () => {
    render(<PasswordField label="Secret" value="abc" onChange={jest.fn()} />);
    const input = screen.getByDisplayValue('abc');
    const toggleBtn = screen.getByRole('button');

    fireEvent.click(toggleBtn);
    expect(input).toHaveAttribute('type', 'text');

    fireEvent.click(toggleBtn);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('calls onChange with new value', () => {
    const onChange = jest.fn();
    render(<PasswordField label="Secret" value="abc" onChange={onChange} />);
    const input = screen.getByDisplayValue('abc');
    fireEvent.change(input, { target: { value: 'abcX' } });
    expect(onChange).toHaveBeenCalledWith('abcX');
  });
});
