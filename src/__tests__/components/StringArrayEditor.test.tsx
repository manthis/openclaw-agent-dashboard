import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StringArrayEditor } from '@/components/config/StringArrayEditor';

describe('StringArrayEditor', () => {
  it('renders the label', () => {
    render(<StringArrayEditor label="My List" value={[]} onChange={jest.fn()} />);
    expect(screen.getByText('My List')).toBeInTheDocument();
  });

  it('renders existing items', () => {
    render(<StringArrayEditor label="List" value={['foo', 'bar']} onChange={jest.fn()} />);
    expect(screen.getByText('foo')).toBeInTheDocument();
    expect(screen.getByText('bar')).toBeInTheDocument();
  });

  it('adds an item via button click', () => {
    const onChange = jest.fn();
    render(<StringArrayEditor label="List" value={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Add item...');
    fireEvent.change(input, { target: { value: 'newitem' } });
    // Only one button when value is empty (add button)
    const btns = screen.getAllByRole('button');
    fireEvent.click(btns[0]); // add button
    expect(onChange).toHaveBeenCalledWith(['newitem']);
  });

  it('adds an item via Enter key', () => {
    const onChange = jest.fn();
    render(<StringArrayEditor label="List" value={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Add item...');
    fireEvent.change(input, { target: { value: 'pressed' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(['pressed']);
  });

  it('does not add duplicate items', () => {
    const onChange = jest.fn();
    render(<StringArrayEditor label="List" value={['dup']} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Add item...');
    fireEvent.change(input, { target: { value: 'dup' } });
    // btns[0] is the add button
    const btns = screen.getAllByRole('button');
    fireEvent.click(btns[0]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('removes an item', () => {
    const onChange = jest.fn();
    render(<StringArrayEditor label="List" value={['a', 'b', 'c']} onChange={onChange} />);
    // btns[0] = add, btns[1..3] = remove for a, b, c
    const removeBtns = screen.getAllByRole('button');
    fireEvent.click(removeBtns[1]); // remove 'a'
    expect(onChange).toHaveBeenCalledWith(['b', 'c']);
  });
});
