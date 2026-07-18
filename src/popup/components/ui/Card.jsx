import React from 'react';
import { cn } from './Button.jsx';

export const Card = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'bg-card border border-border rounded-lg p-3.5 text-text-primary shadow-sm transition-colors duration-150',
      className
    )}
    {...props}
  >
    {children}
  </div>
));
Card.displayName = 'Card';

export const CardHeader = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1 pb-2.5 border-b border-border/60 mb-2.5', className)}
    {...props}
  >
    {children}
  </div>
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-xs font-semibold leading-none tracking-tight text-text-primary flex items-center justify-between', className)}
    {...props}
  >
    {children}
  </h3>
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef(({ className, children, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-[11px] text-text-secondary leading-normal', className)}
    {...props}
  >
    {children}
  </p>
));
CardDescription.displayName = 'CardDescription';
