import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeyValueEditor } from '@/components/config/KeyValueEditor';

describe('KeyValueEditor', () => {
  it('renders the label', () => {
    render(<KeyValueEditor label="Env Vars" value={{}} onChange={jest.fn()} />);
    expect(screen.getByText('Env Vars')).toBeInTheDocument();
  });

  it('renders existing key-value pairs', () => {
    render(<KeyValueEditor label="Env" value={{ FOO: 'bar', BAZ: 'qux' }} onChange={jest.fn()} />);
    expect(screen.getByText('FOO')).toBeInTheDocument();
    expect(screen.getByText('bar')).toBeInTheDocument();
    expect(screen.getByText('BAZ')).toBeInTheDocument();
  });

  it('adds a key-value pair via button', () => {
    const onChange = jest.fn();
    render(<KeyValueEditor label="Env" value={{}} onChange={onChange} keyPlaceholder="KEY" valuePlaceholder="VAL" />);
    const inputs = screen.getAllByRole('textbox', { hidden: true });
    // First input is key, second is value
    fireEvent.change(inputs[0], { target: { value: 'MY_KEY' } });
    fireEvent.change(inputs[1], { target: { value: 'my_val' } });
    fireEvent.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenCalledWith({ MY_KEY: 'my_val' });
  });

  it('adds a pair via Enter in value field', () => {
    const onChange = jest.fn();
    render(<KeyValueEditor label="Env" value={{}} onChange={onChange} />);
    const inputs = document.querySelectorAll('input');
    fireEvent.change(inputs[0], { target: { value: 'K' } });
    fireEvent.change(inputs[1], { target: { value: 'V' } });
    fireEvent.keyDown(inputs[1], { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith({ K: 'V' });
  });

  it('removes a pair', () => {
    const onChange = jest.fn();
    render(<KeyValueEditor label="Env" value={{ A: '1', B: '2' }} onChange={onChange} />);
    const btns = screen.getAllByRole('button');
    // first button is add, rest are remove
    fireEvent.click(btns[1]); // remove A
    expect(onChange).toHaveBeenCalledWith({ B: '2' });
  });
});
