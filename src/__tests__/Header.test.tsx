import React from 'react';
import { render, screen } from '@testing-library/react';
import { Header } from '@/components/Header';

describe('Header', () => {
  it('renders title', () => {
    render(<Header />);
    expect(screen.getByText('OpenClaw Dashboard')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(<Header />);
    expect(screen.getByText('Agent Network Monitor')).toBeInTheDocument();
  });

  it('renders Gateway status indicator', () => {
    render(<Header />);
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });
});
