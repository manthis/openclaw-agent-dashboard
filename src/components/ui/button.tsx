import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
}

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  default: 'bg-neutral-700 hover:bg-neutral-600 text-neutral-100 border border-neutral-600',
  ghost: 'bg-transparent hover:bg-neutral-800 text-neutral-400 border-none',
  outline: 'bg-transparent border border-neutral-600 text-neutral-300 hover:bg-neutral-800',
};

export function Button({ size = 'md', variant = 'default', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none',
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
