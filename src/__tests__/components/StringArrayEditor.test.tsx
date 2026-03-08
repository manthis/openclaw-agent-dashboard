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
    render(<StringArrayEditor label="List" value={['existing']} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Add item...');
    fireEvent.change(input, { target: { value: 'newitem' } });
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(onChange).toHaveBeenCalledWith(['existing', 'newitem']);
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
    fireEvent.click(screen.getByRole('button'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('removes an item', () => {
    const onChange = jest.fn();
    render(<StringArrayEditor label="List" value={['a', 'b', 'c']} onChange={onChange} />);
    // There are remove buttons for each item
    const removeBtns = screen.getAllByRole('button');
    // first button is add, then remove buttons
    fireEvent.click(removeBtns[1]); // remove 'a'
    expect(onChange).toHaveBeenCalledWith(['b', 'c']);
  });
});
