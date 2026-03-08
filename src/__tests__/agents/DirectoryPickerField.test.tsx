import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DirectoryPickerField } from '@/components/agents/DirectoryPickerField';

describe('DirectoryPickerField', () => {
  it('renders input with value', () => {
    render(<DirectoryPickerField value='/home/user' onChange={jest.fn()} />);
    expect(screen.getByDisplayValue('/home/user')).toBeInTheDocument();
  });

  it('calls onChange on text input', () => {
    const onChange = jest.fn();
    render(<DirectoryPickerField value='' onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '/new/path' } });
    expect(onChange).toHaveBeenCalledWith('/new/path');
  });

  it('renders Browse button', () => {
    render(<DirectoryPickerField value='' onChange={jest.fn()} />);
    expect(screen.getByText('Browse')).toBeInTheDocument();
  });

  it('shows alert when showDirectoryPicker not supported', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    render(<DirectoryPickerField value='' onChange={jest.fn()} />);
    fireEvent.click(screen.getByText('Browse'));
    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('not supported'));
    alertSpy.mockRestore();
  });

  it('renders with placeholder', () => {
    render(<DirectoryPickerField value='' onChange={jest.fn()} placeholder='/custom/path' />);
    expect(screen.getByPlaceholderText('/custom/path')).toBeInTheDocument();
  });
});
