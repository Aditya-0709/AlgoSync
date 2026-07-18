import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const Button = React.forwardRef(({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none rounded-md select-none';

  const variants = {
    primary: 'bg-accent text-white hover:bg-accent-hover shadow-sm active:scale-[0.98]',
    secondary: 'bg-card text-text-primary border border-border hover:bg-card-hover hover:border-text-muted active:scale-[0.98]',
    outline: 'border border-border text-text-primary hover:bg-card-hover active:scale-[0.98]',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-card active:scale-[0.98]',
    danger: 'bg-danger/20 text-danger border border-danger/30 hover:bg-danger/30 active:scale-[0.98]',
  };

  const sizes = {
    sm: 'h-7 px-2.5 text-xs gap-1.5',
    md: 'h-8 px-3 text-xs gap-2',
    lg: 'h-9 px-4 text-sm gap-2',
    icon: 'h-8 w-8 p-0',
  };

  return (
    <button
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading...</span>
        </>
      ) : children}
    </button>
  );
});

Button.displayName = 'Button';
