import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from './ui/Card.jsx';
import { Button } from './ui/Button.jsx';
import { Badge } from './ui/Badge.jsx';
import { useStorage, setStorageMultiple } from '../hooks/useStorage.js';
import { uploadRootReadme } from '../../../scripts/models/Repository.js';
import { Github, FolderGit2, RefreshCw, CheckCircle2, AlertCircle, ExternalLink, Unlink, PlusCircle } from 'lucide-react';

export function Dashboard({ onNavigateTab }) {
  const [token] = useStorage('leethub_token', null);
  const [username] = useStorage('leethub_username', null);
  const [repoHook] = useStorage('leethub_hook', null);
  const [stats, setStats] = useStorage('stats', { solved: 0, easy: 0, medium: 0, hard: 0 });
  const [leetcodeEnabled] = useStorage('platform_leetcode_enabled', true);
  const [gfgEnabled] = useStorage('platform_geeksforgeeks_enabled', true);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Hook mode setup local state
  const [setupOption, setSetupOption] = useState('link'); // 'link' | 'new'
  const [repoNameInput, setRepoNameInput] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupError, setSetupError] = useState(null);

  const enabledPlatformsCount = (leetcodeEnabled ? 1 : 0) + (gfgEnabled ? 1 : 0);

  const handleSyncStats = async () => {
    if (!token || !repoHook) return;
    setIsSyncing(true);
    setSyncError(null);
    setSyncSuccess(false);
    try {
      const response = await fetch(`https://api.github.com/repos/${repoHook}/contents/stats.json`, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const content = decodeURIComponent(escape(atob(data.content)));
        const parsed = JSON.parse(content);
        if (parsed && parsed.leetcode) {
          await setStats(parsed.leetcode);
        }
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 3000);
      } else if (response.status === 404) {
        setSyncError('No stats.json found in repository yet. Solve a problem to generate!');
      } else {
        setSyncError(`GitHub API error (${response.status})`);
      }
    } catch (err) {
      setSyncError('Network error while syncing stats');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUnlinkRepo = async () => {
    if (!window.confirm('Are you sure you want to unlink this repository? Your stats are preserved.')) {
      return;
    }
    await setStorageMultiple({
      mode_type: 'hook',
      leethub_hook: null,
      repo: null,
    });
  };

  const handleSetupRepo = async (e) => {
    e.preventDefault();
    if (!token) return;
    const cleanName = repoNameInput.trim();
    if (!cleanName) {
      setSetupError('Please enter a repository name');
      return;
    }
    if (!/^[a-z0-9_.-]+$/i.test(cleanName)) {
      setSetupError('Only alphanumeric, underscores, hyphens, and dots allowed');
      return;
    }

    setIsSettingUp(true);
    setSetupError(null);

    try {
      if (setupOption === 'new') {
        const response = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: cleanName,
            private: true,
            auto_init: true,
            description: 'A collection of LeetCode & coding solutions auto-synced with AlgoSync.',
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || `Error creating repo (${response.status})`);
        }
        await setStorageMultiple({
          mode_type: 'commit',
          leethub_hook: data.full_name,
          repo: data.html_url,
        });
        uploadRootReadme(token, data.full_name).catch(err => {
          console.warn('[AlgoSync] Root README upload during popup repo creation failed:', err);
        });
      } else {
        const fullRepo = cleanName.includes('/') ? cleanName : `${username}/${cleanName}`;
        const response = await fetch(`https://api.github.com/repos/${fullRepo}`, {
          headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(`Repository "${fullRepo}" not found or inaccessible (${response.status})`);
        }
        await setStorageMultiple({
          mode_type: 'commit',
          leethub_hook: data.full_name,
          repo: data.html_url,
        });
      }
    } catch (err) {
      setSetupError(err.message);
    } finally {
      setIsSettingUp(false);
    }
  };

  if (!token) {
    return (
      <div className="p-4 flex flex-col items-center justify-center text-center space-y-3 mt-6">
        <div className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-text-secondary">
          <Github className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Connect Your GitHub</h2>
          <p className="text-xs text-text-secondary mt-1 max-w-[260px]">
            Authorize AlgoSync to automatically push your LeetCode solutions directly to your personal GitHub repository.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          className="w-full mt-2"
          onClick={() => {
            if (window.oAuth2 && window.oAuth2.begin) {
              window.oAuth2.begin();
            } else if (typeof chrome !== 'undefined' && chrome.runtime) {
              chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
            }
          }}
        >
          <Github className="w-3.5 h-3.5 mr-1.5" />
          <span>Authorize GitHub</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-3.5 space-y-3">
      {/* GitHub Status Section */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent font-semibold text-xs">
              {username ? username.charAt(0).toUpperCase() : <Github className="w-3.5 h-3.5" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-text-primary">{username || 'GitHub Connected'}</span>
                <Badge variant="success">Connected</Badge>
              </div>
              <span className="text-[10px] text-text-secondary">OAuth Authenticated</span>
            </div>
          </div>
          {username && (
            <a
              href={`https://github.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-text-primary transition-colors p-1"
              title="Open GitHub Profile"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </Card>

      {/* Repository Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-1.5">
              <FolderGit2 className="w-3.5 h-3.5 text-text-secondary" />
              <span>Target Repository</span>
            </span>
            {repoHook && (
              <Button variant="ghost" size="sm" onClick={handleUnlinkRepo} className="h-6 px-1.5 text-[10px] text-danger hover:bg-danger/10">
                <Unlink className="w-3 h-3 mr-1" />
                Unlink
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            {repoHook ? 'All submissions will automatically sync here.' : 'Select or create a repository to start syncing.'}
          </CardDescription>
        </CardHeader>

        {repoHook ? (
          <div className="flex items-center justify-between bg-background border border-border/80 rounded px-2.5 py-1.5 mt-1">
            <span className="text-xs font-mono text-text-primary truncate max-w-[220px]" title={repoHook}>
              {repoHook}
            </span>
            <a
              href={`https://github.com/${repoHook}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-hover flex items-center gap-1 text-[11px] font-medium shrink-0 ml-2"
            >
              <span>View</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : (
          <form onSubmit={handleSetupRepo} className="space-y-2.5 mt-2">
            <div className="grid grid-cols-2 gap-1.5 bg-background p-1 rounded border border-border">
              <button
                type="button"
                onClick={() => setSetupOption('link')}
                className={`text-xs py-1 rounded font-medium transition-all ${
                  setupOption === 'link' ? 'bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Link Existing
              </button>
              <button
                type="button"
                onClick={() => setSetupOption('new')}
                className={`text-xs py-1 rounded font-medium transition-all ${
                  setupOption === 'new' ? 'bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Create New Repo
              </button>
            </div>
            <div>
              <input
                type="text"
                placeholder={setupOption === 'new' ? 'e.g. LeetCode-Solutions' : 'e.g. username/LeetCode-Solutions'}
                value={repoNameInput}
                onChange={(e) => setRepoNameInput(e.target.value)}
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            {setupError && (
              <p className="text-[11px] text-danger flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{setupError}</span>
              </p>
            )}
            <Button variant="primary" size="md" className="w-full" type="submit" isLoading={isSettingUp}>
              {setupOption === 'new' ? 'Create & Link Repository' : 'Connect Repository'}
            </Button>
          </form>
        )}
      </Card>

      {/* Quick Status & Sync Metrics */}
      <div className="grid grid-cols-2 gap-2.5">
        <Card className="flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-text-secondary">Platforms Enabled</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-bold text-text-primary">{enabledPlatformsCount} active</span>
            <Button variant="ghost" size="sm" onClick={() => onNavigateTab?.('platforms')} className="h-6 px-1.5 text-[10px] text-accent">
              Manage
            </Button>
          </div>
        </Card>
        <Card className="flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-text-secondary">Total Solved</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-bold text-text-primary">{stats?.solved || 0} problems</span>
            <Button variant="ghost" size="sm" onClick={() => onNavigateTab?.('stats')} className="h-6 px-1.5 text-[10px] text-accent">
              Details
            </Button>
          </div>
        </Card>
      </div>

      {/* Sync Control Action */}
      <Card className="bg-card/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-background border border-border flex items-center justify-center text-text-secondary">
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-accent' : ''}`} />
            </div>
            <div>
              <span className="text-xs font-medium text-text-primary block">Manual Synchronization</span>
              <span className="text-[10px] text-text-secondary">
                {syncSuccess ? (
                  <span className="text-success flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Stats synchronized
                  </span>
                ) : syncError ? (
                  <span className="text-danger truncate max-w-[150px] block" title={syncError}>{syncError}</span>
                ) : (
                  'Sync local counters with GitHub'
                )}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncStats}
            isLoading={isSyncing}
            disabled={!repoHook}
            className="h-7 text-xs"
          >
            Sync Now
          </Button>
        </div>
      </Card>
    </div>
  );
}
