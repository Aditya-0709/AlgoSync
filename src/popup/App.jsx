import React, { useState } from 'react';
import { Tabs } from './components/ui/Tabs.jsx';
import { Dashboard } from './components/Dashboard.jsx';
import { Settings } from './components/Settings.jsx';
import { PlatformManager } from './components/PlatformManager.jsx';
import { Statistics } from './components/Statistics.jsx';
import { About } from './components/About.jsx';
import { useStorage } from './hooks/useStorage.js';
import { LayoutDashboard, Sliders, Globe, BarChart3, Info, CheckCircle2 } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [token] = useStorage('leethub_token', null);
  const [repoHook] = useStorage('leethub_hook', null);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'settings', label: 'Settings', icon: Sliders },
    { id: 'platforms', label: 'Platforms', icon: Globe },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'about', label: 'About', icon: Info },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigateTab={(tabId) => setActiveTab(tabId)} />;
      case 'settings':
        return <Settings />;
      case 'platforms':
        return <PlatformManager />;
      case 'stats':
        return <Statistics />;
      case 'about':
        return <About />;
      default:
        return <Dashboard onNavigateTab={(tabId) => setActiveTab(tabId)} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-text-primary select-none">
      {/* Top Application Header */}
      <header className="flex items-center justify-between px-3.5 py-2.5 border-b border-border bg-card/50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-accent flex items-center justify-center text-white font-bold text-xs shadow-sm">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M16 18l6-6-6-6" />
              <path d="M8 6l-6 6 6 6" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-tight text-text-primary leading-none">AlgoSync</span>
            <span className="text-[9px] text-text-secondary leading-none mt-0.5">Automated GitHub Sync</span>
          </div>
        </div>

        {/* Global Connection Pill */}
        <div className="flex items-center gap-1.5 bg-background border border-border px-2 py-1 rounded-full">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              token && repoHook ? 'bg-success animate-pulse' : token ? 'bg-warning' : 'bg-text-muted'
            }`}
          />
          <span className="text-[10px] font-medium text-text-secondary truncate max-w-[120px]">
            {token && repoHook ? repoHook.split('/')[1] || repoHook : token ? 'No Repo Linked' : 'Offline'}
          </span>
        </div>
      </header>

      {/* Navigation Tabs Bar */}
      <Tabs
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId)}
        tabs={tabs}
        className="shrink-0"
      />

      {/* Tab Content Container */}
      <main className="flex-1 overflow-y-auto">
        {renderTabContent()}
      </main>

      {/* Minimal Footer Status */}
      <footer className="px-3.5 py-1.5 border-t border-border/60 bg-background flex items-center justify-between text-[10px] text-text-muted shrink-0">
        <span>v2.0.9</span>
        <span className="flex items-center gap-1">
          {token && repoHook && <CheckCircle2 className="w-3 h-3 text-success inline" />}
          <span>{token && repoHook ? 'Ready to sync' : 'Configure GitHub'}</span>
        </span>
      </footer>
    </div>
  );
}
