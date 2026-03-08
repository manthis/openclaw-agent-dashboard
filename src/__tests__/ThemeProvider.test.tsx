import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'theme-provider' }, children),
}));

import { ThemeProvider } from '@/components/ThemeProvider';

describe('ThemeProvider', () => {
  it('renders children', () => {
    render(<ThemeProvider attribute="class"><span>hello</span></ThemeProvider>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
});
