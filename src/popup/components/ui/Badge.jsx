import React from 'react';
import { cn } from './Button.jsx';

export const Badge = ({ className, variant = 'default', children, ...props }) => {
  const variants = {
    default: 'bg-card border-border text-text-secondary',
    success: 'bg-success/15 border-success/30 text-success font-medium',
    accent: 'bg-accent/15 border-accent/30 text-accent font-medium',
    warning: 'bg-warning/15 border-warning/30 text-warning font-medium',
    danger: 'bg-danger/15 border-danger/30 text-danger font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] transition-colors duration-150 tracking-wide select-none',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';
