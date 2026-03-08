import React from 'react';
import { render } from '@testing-library/react';

const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: mockReplace }) }));

import { MobileRedirect } from '@/components/MobileRedirect';

describe('MobileRedirect', () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it('redirects on mobile viewport', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({ matches: query.includes('max-width'), addListener: jest.fn(), removeListener: jest.fn() }),
    });
    render(<MobileRedirect />);
    expect(mockReplace).toHaveBeenCalledWith('/agents');
  });

  it('does not redirect on desktop viewport', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: () => ({ matches: false, addListener: jest.fn(), removeListener: jest.fn() }),
    });
    render(<MobileRedirect />);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('renders null', () => {
    const { container } = render(<MobileRedirect />);
    expect(container.firstChild).toBeNull();
  });
});
