import React from 'react';
import { cn } from './Button.jsx';

export const Switch = React.forwardRef(({ className, checked, onCheckedChange, disabled, id, ...props }, ref) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      disabled={disabled}
      ref={ref}
      onClick={() => !disabled && onCheckedChange?.(!checked)}
      className={cn(
        'peer inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-accent' : 'bg-border',
        className
      )}
      {...props}
    >
      <span
        data-state={checked ? 'checked' : 'unchecked'}
        className={cn(
          'pointer-events-none block h-3 w-3 rounded-full bg-white shadow-sm ring-0 transition-transform duration-150',
          checked ? 'translate-x-3' : 'translate-x-0'
        )}
      />
    </button>
  );
});

Switch.displayName = 'Switch';
