/**
 * AlgoSync Popup Script
 * Modern vanilla JS implementation - no jQuery, no Semantic UI
 */

import { getBrowser, getGitHubRepoUrl, normalizeGitHubRepoName } from './core/util.js';

// ============================================================================
// CONSTANTS & CONFIG
// ============================================================================

const STORAGE_KEYS = {
  THEME: 'algosync-theme',
  TOKEN: 'leethub_token',
  USERNAME: 'leethub_username',
  MODE_TYPE: 'mode_type',
  REPO_HOOK: 'leethub_hook',
  REPO_URL: 'repo',
  STATS: 'stats',
  SYNC_STATS: 'sync_stats',
  SOLUTION_MODE: 'solution_upload_mode',
  DEFAULT_SOLUTION_MODE: 'overwrite'
};

const AUTHENTICATION_URL = 'https://api.github.com/user';
const CREATE_REPO_URL = 'https://api.github.com/user/repos';
const REPO_URL_BASE = 'https://api.github.com/repos/';

const THEMES = ['system', 'light', 'dark'];
const DEFAULT_THEME = 'system';

// ============================================================================
// THEME MODULE
// ============================================================================

const Theme = {
  current: DEFAULT_THEME,

  init() {
    // Load saved theme
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved && THEMES.includes(saved)) {
      this.current = saved;
    }

    // Apply theme immediately
    this.apply(this.current);

    // Listen for system theme changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => {
        if (this.current === 'system') {
          this.apply('system');
        }
      });
    }

    // Setup toggle button
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => this.cycle());
      this.updateToggleButton();
    }
  },

  apply(theme) {
    this.current = theme;
    const resolvedTheme = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;

    document.documentElement.setAttribute('data-theme', resolvedTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    this.updateToggleButton();
  },

  cycle() {
    const currentIndex = THEMES.indexOf(this.current);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    this.apply(THEMES[nextIndex]);
  },

  updateToggleButton() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    const icons = toggle.querySelectorAll('svg');
    icons.forEach(icon => icon.hidden = true);

    const resolvedTheme = this.current === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : this.current;

    const iconMap = {
      light: 'icon-sun',
      dark: 'icon-moon',
      system: 'icon-system'
    };

    const activeIcon = toggle.querySelector(`.${iconMap[resolvedTheme]}`);
    if (activeIcon) activeIcon.hidden = false;

    toggle.setAttribute('aria-label', `Current theme: ${this.current}. Click to cycle.`);
    toggle.title = `Theme: ${this.current.charAt(0).toUpperCase() + this.current.slice(1)}`;
  }
};

// ============================================================================
// STATS ANIMATION MODULE
// ============================================================================

const StatsAnimation = {
  counters: new Map(),
  rings: new Map(),

  animateCounters(targets, duration = 1200) {
    targets.forEach(({ element, target, suffix = '' }) => {
      const start = parseInt(element.textContent) || 0;
      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (target - start) * eased);

        element.textContent = current + suffix;

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    });
  },

  animateRing(ringElement, targetPercent, duration = 1500) {
    const circumference = 2 * Math.PI * 32; // r=32
    const startOffset = circumference;
    const targetOffset = circumference * (1 - targetPercent / 100);
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentOffset = startOffset - (startOffset - targetOffset) * eased;

      ringElement.style.strokeDashoffset = currentOffset;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  },

  animateAll(stats) {
    // Animate counters
    const counters = [
      { element: document.getElementById('p-solved'), target: stats.solved || 0 },
      { element: document.getElementById('p-solved-easy'), target: stats.easy || 0 },
      { element: document.getElementById('p-solved-medium'), target: stats.medium || 0 },
      { element: document.getElementById('p-solved-hard'), target: stats.hard || 0 },
      { element: document.getElementById('p-streak'), target: stats.streak?.current || 0, suffix: '' }
    ].filter(({ element }) => element);

    this.animateCounters(counters);

    // Animate progress rings
    const total = stats.solved || 1;
    const easyPercent = ((stats.easy || 0) / total) * 100;
    const mediumPercent = ((stats.medium || 0) / total) * 100;
    const hardPercent = ((stats.hard || 0) / total) * 100;

    const rings = [
      { element: document.querySelector('.ring-easy'), percent: easyPercent },
      { element: document.querySelector('.ring-medium'), percent: mediumPercent },
      { element: document.querySelector('.ring-hard'), percent: hardPercent }
    ].filter(({ element }) => element);

    rings.forEach(({ element, percent }) => {
      this.animateRing(element, percent);
    });

    // Animate activity chart
    this.animateActivityChart(stats.weekly || []);
  },

  animateActivityChart(weeklyData) {
    const bars = document.querySelectorAll('.activity-bar');
    if (!bars.length) return;

    bars.forEach((bar, index) => {
      const dayData = weeklyData[index] || { count: 0 };
      const maxCount = Math.max(...weeklyData.map(d => d.count), 1);
      const heightPercent = (dayData.count / maxCount) * 100;

      bar.style.setProperty('--bar-height', `${heightPercent}%`);
      bar.classList.toggle('has-data', dayData.count > 0);
      bar.classList.toggle('today', index === weeklyData.length - 1);

      const tooltip = bar.querySelector('.activity-tooltip');
      if (tooltip) {
        tooltip.textContent = `${dayData.count} problem${dayData.count !== 1 ? 's' : ''}`;
      }
    });
  }
};

// ============================================================================
// STORAGE HELPERS
// ============================================================================

const Storage = {
  api: getBrowser(),

  async get(keys) {
    return new Promise((resolve) => {
      this.api.storage.local.get(keys, resolve);
    });
  },

  async set(data) {
    return new Promise((resolve) => {
      this.api.storage.local.set(data, resolve);
    });
  },

  async remove(keys) {
    return new Promise((resolve) => {
      this.api.storage.local.remove(keys, resolve);
    });
  }
};

// ============================================================================
// GITHUB API HELPERS
// ============================================================================

const GitHubAPI = {
  async validateToken(token) {
    try {
      const response = await fetch(AUTHENTICATION_URL, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });
      return response.ok ? await response.json() : null;
    } catch {
      return null;
    }
  },

  async createRepo(token, name) {
    const response = await fetch(CREATE_REPO_URL, {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        private: true,
        auto_init: true,
        description: 'A collection of LeetCode questions to ace the coding interview! - Created using [AlgoSync](https://github.com/arunbhardwaj/LeetHub-2.0)'
      })
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  },

  async linkRepo(token, repoName) {
    const normalized = normalizeGitHubRepoName(repoName);
    const response = await fetch(`${REPO_URL_BASE}${normalized}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data, normalized };
  }
};

// ============================================================================
// UI STATE MANAGEMENT
// ============================================================================

const UI = {
  currentMode: null,

  elements: {},

  cacheElements() {
    this.elements = {
      // Mode panels
      authMode: document.getElementById('auth-mode'),
      hookMode: document.getElementById('hook-mode'),
      commitMode: document.getElementById('commit-mode'),

      // Auth
      authenticateBtn: document.getElementById('authenticate'),
      authHint: document.getElementById('auth-hint'),

      // Hook
      repoOptions: document.querySelectorAll('input[name="repo-option"]'),
      repoNameStep: document.getElementById('step-name'),
      repoNameInput: document.getElementById('repo-name'),
      repoNameError: document.getElementById('repo-name-error'),
      hookButton: document.getElementById('hook-button'),
      hookError: document.getElementById('hook-error'),
      hookSuccess: document.getElementById('hook-success'),

      // Commit
      repoUrl: document.getElementById('repo-url'),
      unlinkRepo: document.getElementById('unlink-repo'),

      // Stats
      pSolved: document.getElementById('p-solved'),
      pSolvedEasy: document.getElementById('p-solved-easy'),
      pSolvedMedium: document.getElementById('p-solved-medium'),
      pSolvedHard: document.getElementById('p-solved-hard'),
      pStreak: document.getElementById('p-streak'),

      // Settings
      overwriteMode: document.getElementById('overwrite-mode'),
      multiMode: document.getElementById('multi-mode'),
      resetStats: document.getElementById('reset-stats'),
      resetConfirmation: document.getElementById('reset-confirmation'),
      resetConfirm: document.getElementById('reset-confirm'),
      resetCancel: document.getElementById('reset-cancel')
    };
  },

  showMode(mode) {
    // Hide all modes
    Object.values(this.elements).forEach(el => {
      if (el && el.classList && el.classList.contains('mode-panel')) {
        el.hidden = true;
      }
    });

    // Show target mode
    const modeMap = {
      auth: 'authMode',
      hook: 'hookMode',
      commit: 'commitMode'
    };

    const element = this.elements[modeMap[mode]];
    if (element) {
      element.hidden = false;
      // Trigger entrance animation
      requestAnimationFrame(() => {
        element.classList.add('animate-fade-in');
      });
    }

    this.currentMode = mode;
  },

  showError(container, message) {
    if (!container) return;
    const textEl = container.querySelector('.alert-text') || container;
    textEl.textContent = message;
    container.hidden = false;
    container.classList.add('animate-slide-down');
  },

  hideError(container) {
    if (!container) return;
    container.hidden = true;
    container.classList.remove('animate-slide-down');
  },

  showSuccess(container, message) {
    if (!container) return;
    const textEl = container.querySelector('.alert-text') || container;
    textEl.innerHTML = message; // Allow HTML for links
    container.hidden = false;
    container.classList.add('animate-slide-down');
  },

  setButtonLoading(button, loading) {
    if (!button) return;
    const text = button.querySelector('.btn-text');
    const loadingEl = button.querySelector('.btn-loading');

    if (loading) {
      button.disabled = true;
      if (text) text.hidden = true;
      if (loadingEl) loadingEl.hidden = false;
    } else {
      button.disabled = false;
      if (text) text.hidden = false;
      if (loadingEl) loadingEl.hidden = true;
    }
  }
};

// ============================================================================
// MODE HANDLERS
// ============================================================================

const AuthMode = {
  async init() {
    UI.elements.authenticateBtn.addEventListener('click', () => {
      if (typeof oAuth2 !== 'undefined' && oAuth2.begin) {
        oAuth2.begin();
      }
    });
  }
};

const HookMode = {
  selectedOption: null,

  init() {
    // Radio option selection
    UI.elements.repoOptions.forEach(radio => {
      radio.addEventListener('change', (e) => this.handleOptionChange(e.target.value));
    });

    // Repo name input validation
    UI.elements.repoNameInput.addEventListener('input', () => this.validateRepoName());
    UI.elements.repoNameInput.addEventListener('blur', () => this.validateRepoName());

    // Hook button
    UI.elements.hookButton.addEventListener('click', () => this.handleHookClick());
  },

  handleOptionChange(value) {
    this.selectedOption = value;
    UI.elements.repoNameStep.hidden = false;
    UI.elements.repoNameInput.focus();
    UI.elements.hookButton.disabled = false;
    UI.hideError(UI.elements.hookError);
    UI.hideError(UI.elements.hookSuccess);
  },

  validateRepoName() {
    const name = UI.elements.repoNameInput.value.trim();
    if (!name) {
      this.showRepoNameError('Repository name is required');
      return false;
    }
    if (!/^[a-z0-9_.-]+$/i.test(name)) {
      this.showRepoNameError('Only alphanumeric, underscore, hyphen, and dot allowed');
      return false;
    }
    if (name.length > 100) {
      this.showRepoNameError('Name too long (max 100 characters)');
      return false;
    }
    UI.hideError(UI.elements.repoNameError);
    return true;
  },

  showRepoNameError(message) {
    UI.elements.repoNameError.textContent = message;
    UI.elements.repoNameError.hidden = false;
  },

  async handleHookClick() {
    if (!this.selectedOption) {
      UI.showError(UI.elements.hookError, 'Please select an option');
      return;
    }

    if (!this.validateRepoName()) {
      UI.elements.repoNameInput.focus();
      return;
    }

    UI.hideError(UI.elements.hookError);
    UI.hideError(UI.elements.hookSuccess);
    UI.setButtonLoading(UI.elements.hookButton, true);

    try {
      const { leethub_token: token } = await Storage.get([STORAGE_KEYS.TOKEN]);
      if (!token) {
        throw new Error('Not authenticated. Please connect GitHub first.');
      }

      const repoName = UI.elements.repoNameInput.value.trim();

      if (this.selectedOption === 'new') {
        await this.createRepo(token, repoName);
      } else {
        const { leethub_username: username } = await Storage.get([STORAGE_KEYS.USERNAME]);
        if (!username) {
          throw new Error('Username not found. Please re-authenticate.');
        }
        await this.linkRepo(token, username, repoName);
      }
    } catch (error) {
      UI.showError(UI.elements.hookError, error.message);
    } finally {
      UI.setButtonLoading(UI.elements.hookButton, false);
    }
  },

  async createRepo(token, name) {
    const result = await GitHubAPI.createRepo(token, name);

    if (!result.ok) {
      const errorMessages = {
        304: `Unable to modify repository. Try again later!`,
        400: `Bad request. Make sure you're not overriding any existing scripts.`,
        401: `Unauthorized access. Try again later!`,
        403: `Forbidden access to repository. Try again later!`,
        422: `Repository may already exist. Try linking instead.`
      };
      throw new Error(errorMessages[result.status] || `Error creating repository: ${result.data.message || 'Unknown error'}`);
    }

    // Save to storage
    await Storage.set({
      [STORAGE_KEYS.MODE_TYPE]: 'commit',
      [STORAGE_KEYS.REPO_HOOK]: result.data.full_name,
      [STORAGE_KEYS.REPO_URL]: result.data.html_url
    });

    // Clear stats for new repo
    await Storage.remove([STORAGE_KEYS.STATS]);

    UI.showSuccess(UI.elements.hookSuccess,
      `Successfully created <a target="_blank" href="${result.data.html_url}">${name}</a>. Start <a href="https://leetcode.com">LeetCoding</a>!`
    );

    // Switch to commit mode after delay
    setTimeout(() => this.transitionToCommitMode(result.data), 1500);
  },

  async linkRepo(token, username, name) {
    const repoHook = username ? `${username}/${name}` : name;
    const result = await GitHubAPI.linkRepo(token, repoHook);

    if (!result.ok) {
      const repoUrl = getGitHubRepoUrl(result.normalized);
      const errorMessages = {
        301: `This repository has been moved permanently. Try creating a new one.`,
        403: `Forbidden action. Please make sure you have the right access to this repository.`,
        404: `Repository not found. Make sure you enter the right repository name.`
      };
      throw new Error(`${errorMessages[result.status] || 'Error linking repository'} <a target="_blank" href="${repoUrl}">${result.normalized}</a>`);
    }

    // Save to storage
    await Storage.set({
      [STORAGE_KEYS.MODE_TYPE]: 'commit',
      [STORAGE_KEYS.REPO_HOOK]: result.data.full_name,
      [STORAGE_KEYS.REPO_URL]: result.data.html_url
    });

    // Sync stats if needed
    const { sync_stats: syncStats } = await Storage.get([STORAGE_KEYS.SYNC_STATS]);
    if (syncStats) {
      await this.syncStats(token, result.data.full_name);
    } else {
      const { stats } = await Storage.get([STORAGE_KEYS.STATS]);
      this.updateStatsDisplay(stats);
    }

    UI.showSuccess(UI.elements.hookSuccess,
      `Successfully linked <a target="_blank" href="${result.data.html_url}">${result.normalized}</a> to AlgoSync. Start <a href="https://leetcode.com">LeetCoding</a> now!`
    );

    setTimeout(() => this.transitionToCommitMode(result.data), 1500);
  },

  async syncStats(token, hook) {
    try {
      const response = await fetch(`https://api.github.com/repos/${hook}/contents/stats.json`, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const content = decodeURIComponent(escape(atob(data.content)));
        const parsed = JSON.parse(content);

        await Storage.set({
          [STORAGE_KEYS.STATS]: parsed.leetcode,
          [STORAGE_KEYS.SYNC_STATS]: false
        });

        this.updateStatsDisplay(parsed.leetcode);
      }
    } catch (e) {
      console.warn('Failed to sync stats:', e);
    }
  },

  updateStatsDisplay(stats) {
    if (!stats) return;
    UI.elements.pSolved.textContent = stats.solved || 0;
    UI.elements.pSolvedEasy.textContent = stats.easy || 0;
    UI.elements.pSolvedMedium.textContent = stats.medium || 0;
    UI.elements.pSolvedHard.textContent = stats.hard || 0;
  },

  transitionToCommitMode(repoData) {
    UI.showMode('commit');
    CommitMode.init(repoData);
  }
};

const CommitMode = {
  async init(repoData) {
    // Setup repo link
    if (repoData) {
      const normalized = normalizeGitHubRepoName(repoData.full_name);
      UI.elements.repoUrl.innerHTML = `<a target="_blank" href="${getGitHubRepoUrl(normalized)}">${normalized}</a>`;
    } else {
      const { leethub_hook: hook } = await Storage.get([STORAGE_KEYS.REPO_HOOK]);
      if (hook) {
        const normalized = normalizeGitHubRepoName(hook);
        UI.elements.repoUrl.innerHTML = `<a target="_blank" href="${getGitHubRepoUrl(normalized)}">${normalized}</a>`;
      }
    }

    // Load stats
    await this.loadStats();

    // Setup event listeners
    UI.elements.unlinkRepo.addEventListener('click', () => this.handleUnlink());

    UI.elements.overwriteMode.addEventListener('change', () => this.handleSolutionModeChange('overwrite'));
    UI.elements.multiMode.addEventListener('change', () => this.handleSolutionModeChange('multi'));

    UI.elements.resetStats.addEventListener('click', () => this.showResetConfirmation());
    UI.elements.resetConfirm.addEventListener('click', () => this.confirmReset());
    UI.elements.resetCancel.addEventListener('click', () => this.hideResetConfirmation());
  },

  async loadStats() {
    const { stats } = await Storage.get([STORAGE_KEYS.STATS]);
    if (stats) {
      this.displayStats(stats);
    } else {
      // Show zeros with animation
      this.displayStats({ solved: 0, easy: 0, medium: 0, hard: 0, streak: { current: 0 } });
    }
  },

  displayStats(stats) {
    // Update counter elements
    UI.elements.pSolved.textContent = stats.solved || 0;
    UI.elements.pSolvedEasy.textContent = stats.easy || 0;
    UI.elements.pSolvedMedium.textContent = stats.medium || 0;
    UI.elements.pSolvedHard.textContent = stats.hard || 0;
    UI.elements.pStreak.textContent = stats.streak?.current || 0;

    // Animate
    requestAnimationFrame(() => {
      StatsAnimation.animateAll(stats);
    });
  },

  async handleUnlink() {
    if (!confirm('Are you sure you want to unlink this repository? Your stats will be preserved but you\'ll need to set up a repo again.')) {
      return;
    }

    await Storage.set({
      [STORAGE_KEYS.MODE_TYPE]: 'hook',
      [STORAGE_KEYS.REPO_HOOK]: null,
      [STORAGE_KEYS.SYNC_STATS]: true
    });

    UI.showMode('hook');
    HookMode.init();
  },

  handleSolutionModeChange(mode) {
    Storage.set({ [STORAGE_KEYS.SOLUTION_MODE]: mode });
  },

  showResetConfirmation() {
    UI.elements.resetConfirmation.hidden = false;
    UI.elements.resetConfirm.focus();
  },

  hideResetConfirmation() {
    UI.elements.resetConfirmation.hidden = true;
  },

  async confirmReset() {
    await Storage.set({ [STORAGE_KEYS.STATS]: null });
    this.displayStats({ solved: 0, easy: 0, medium: 0, hard: 0, streak: { current: 0 } });
    this.hideResetConfirmation();
  }
};

// ============================================================================
// SOLUTION MODE SETUP
// ============================================================================

async function setupSolutionMode() {
  const { solution_upload_mode: mode } = await Storage.get([STORAGE_KEYS.SOLUTION_MODE]);
  const selectedMode = mode || STORAGE_KEYS.DEFAULT_SOLUTION_MODE;

  const overwriteRadio = document.getElementById('overwrite-mode');
  const multiRadio = document.getElementById('multi-mode');

  if (selectedMode === 'multi') {
    multiRadio.checked = true;
  } else {
    overwriteRadio.checked = true;
  }
}

// ============================================================================
// MAIN INITIALIZATION
// ============================================================================

async function init() {
  // Initialize theme system first
  Theme.init();

  // Cache UI elements
  UI.cacheElements();

  // Setup solution mode
  await setupSolutionMode();

  // Check authentication
  const { leethub_token: token } = await Storage.get([STORAGE_KEYS.TOKEN]);

  if (!token) {
    // Not authenticated - show auth mode
    UI.showMode('auth');
    AuthMode.init();
    return;
  }

  // Validate token
  const user = await GitHubAPI.validateToken(token);

  if (!user) {
    // Token invalid - reset and show auth
    await Storage.set({ [STORAGE_KEYS.TOKEN]: null });
    UI.showMode('auth');
    AuthMode.init();
    return;
  }

  // Save username
  await Storage.set({ [STORAGE_KEYS.USERNAME]: user.login });

  // Check mode type
  const { mode_type: modeType } = await Storage.get([STORAGE_KEYS.MODE_TYPE]);

  if (modeType === 'commit') {
    // Check if still have access to repo
    const { leethub_hook: hook } = await Storage.get([STORAGE_KEYS.REPO_HOOK]);
    if (hook) {
      try {
        await GitHubAPI.linkRepo(token, hook);
        // If successful, show commit mode
        UI.showMode('commit');
        await CommitMode.init();
      } catch {
        // Lost access - fallback to hook mode
        await Storage.set({ [STORAGE_KEYS.MODE_TYPE]: 'hook', [STORAGE_KEYS.REPO_HOOK]: null });
        UI.showMode('hook');
        HookMode.init();
      }
    } else {
      UI.showMode('hook');
      HookMode.init();
    }
  } else {
    UI.showMode('hook');
    HookMode.init();
  }
}

// ============================================================================
// OAUTH2 INTEGRATION (Legacy support)
// ============================================================================

// This will be loaded from oauth2.js script
// We just need to make sure the global oAuth2 object is available
window.oAuth2 = window.oAuth2 || {
  begin: () => console.warn('oAuth2 not loaded')
};

// ============================================================================
// START
// ============================================================================

document.addEventListener('DOMContentLoaded', init);