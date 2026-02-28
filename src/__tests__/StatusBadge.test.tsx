import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '@/components/StatusBadge';

describe('StatusBadge', () => {
  it('renders Active for active status', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders Idle for idle status', () => {
    render(<StatusBadge status="idle" />);
    expect(screen.getByText('Idle')).toBeInTheDocument();
  });

  it('has animate-pulse class for active', () => {
    const { container } = render(<StatusBadge status="active" />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});
