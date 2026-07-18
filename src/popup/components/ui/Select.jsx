import React from 'react';
import { cn } from './Button.jsx';

export const Select = React.forwardRef(({ className, value, onChange, options = [], disabled, ...props }, ref) => {
  return (
    <div className="relative inline-block w-full">
      <select
        ref={ref}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={cn(
          'flex h-8 w-full items-center justify-between rounded-md border border-border bg-card px-2.5 py-1 text-xs text-text-primary shadow-sm ring-offset-background placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-150 appearance-none pr-8 cursor-pointer',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-card text-text-primary text-xs py-1">
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
});

Select.displayName = 'Select';
