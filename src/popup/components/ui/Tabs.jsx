import React from 'react';
import { cn } from './Button.jsx';

export const Tabs = ({ activeTab, onTabChange, tabs = [], className }) => {
  return (
    <div className={cn('flex items-center border-b border-border bg-background px-3 pt-2 gap-1 overflow-x-auto select-none', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 relative whitespace-nowrap focus-visible:outline-none focus-visible:text-text-primary',
              isActive
                ? 'text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            {Icon && <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-accent' : 'text-text-muted')} />}
            <span>{tab.label}</span>
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent rounded-t-sm" />
            )}
          </button>
        );
      })}
    </div>
  );
};
