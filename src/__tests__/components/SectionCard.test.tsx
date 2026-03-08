import React from 'react';
import { render, screen } from '@testing-library/react';
import { SectionCard } from '@/components/config/SectionCard';

describe('SectionCard', () => {
  it('renders the title', () => {
    render(<SectionCard title="My Section"><div>content</div></SectionCard>);
    expect(screen.getByText('My Section')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<SectionCard title="Section"><span>child content</span></SectionCard>);
    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(
      <SectionCard title="Section" icon={<span data-testid="icon">★</span>}>
        <div>content</div>
      </SectionCard>
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});
