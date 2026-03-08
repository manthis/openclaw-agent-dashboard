import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('next/navigation', () => ({ usePathname: () => '/dashboard' }));
jest.mock('lucide-react', () => ({
  LayoutDashboard: () => React.createElement('span', null, 'icon-dashboard'),
  Network: () => React.createElement('span', null, 'icon-network'),
  Users: () => React.createElement('span', null, 'icon-users'),
  Settings: () => React.createElement('span', null, 'icon-settings'),
}));

import { BottomNav } from '@/components/BottomNav';

describe('BottomNav', () => {
  it('renders all nav items', () => {
    render(<BottomNav />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Agents Map')).toBeInTheDocument();
    expect(screen.getByText('Agents')).toBeInTheDocument();
    expect(screen.getByText('Config')).toBeInTheDocument();
  });

  it('Dashboard link has active class when pathname matches', () => {
    render(<BottomNav />);
    const link = screen.getByText('Dashboard').closest('a');
    expect(link).toHaveClass('text-indigo-600');
  });

  it('non-active links have gray class', () => {
    render(<BottomNav />);
    const link = screen.getByText('Agents').closest('a');
    expect(link).toHaveClass('text-gray-500');
  });
});
