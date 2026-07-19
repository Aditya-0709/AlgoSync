/**
 * AlgoSync Welcome Page Script
 * Modern vanilla JS implementation for onboarding flow
 */

import { getBrowser } from './utils/helpers.js';
import { getGitHubRepoUrl, normalizeGitHubRepoName, uploadRootReadme } from './models/Repository.js';
import { getRootReadmeTemplate } from './generators/mainReadmeGenerator.js';
import { STORAGE_KEYS } from './constants/storage.js';
import { GitHubAPI } from './github/repository.js';
import { storageService as Storage } from './services/storageService.js';

// ============================================================================
// CONSTANTS & CONFIG
// ============================================================================

const THEMES = ['system', 'light', 'dark'];
const DEFAULT_THEME = 'system';

// ============================================================================
// THEME MODULE
// ============================================================================

const Theme = {
  current: DEFAULT_THEME,

  init() {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved && THEMES.includes(saved)) {
      this.current = saved;
    }
    this.apply(this.current);

    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => {
        if (this.current === 'system') {
          this.apply('system');
        }
      });
    }

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
  }
};

// Apply theme immediately when module loads to prevent flash of unstyled content
Theme.init();

// ============================================================================
// STORAGE HELPERS (Delegated to StorageService)
// ============================================================================



// ============================================================================
// UI HELPERS
// ============================================================================

const UI = {
  elements: {},

  cacheElements() {
    this.elements = {
      // Steps
      stepAuth: document.getElementById('step-auth'),
      stepRepo: document.getElementById('step-repo'),
      stepSuccess: document.getElementById('step-success'),

      // Stepper items
      stepperItems: document.querySelectorAll('.stepper-item'),

      // Auth
      authBtn: document.getElementById('auth-btn'),
      authError: document.getElementById('auth-error'),

      // Repo
      repoOptions: document.querySelectorAll('.option-card input[name="repo-option"]'),
      optionCards: document.querySelectorAll('.option-card'),
      nameSection: document.getElementById('name-section'),
      namePrefix: document.getElementById('name-prefix'),
      repoNameInput: document.getElementById('repo-name'),
      nameHint: document.getElementById('name-hint'),
      nameError: document.getElementById('name-error'),
      continueBtn: document.getElementById('continue-btn'),
      repoError: document.getElementById('repo-error'),
      repoSuccess: document.getElementById('repo-success'),

      // Success
      successRepo: document.getElementById('success-repo'),
      openLeetcode: document.getElementById('open-leetcode'),
      openPopup: document.getElementById('open-popup')
    };
  },

  showStep(stepNumber) {
    // Hide all steps
    [this.elements.stepAuth, this.elements.stepRepo, this.elements.stepSuccess].forEach(el => {
      if (el) el.hidden = true;
    });

    // Show target step
    const stepMap = {
      1: 'stepAuth',
      2: 'stepRepo',
      3: 'stepSuccess'
    };

    const element = this.elements[stepMap[stepNumber]];
    if (element) {
      element.hidden = false;
      requestAnimationFrame(() => {
        element.classList.add('animate-fade-in');
      });
    }

    // Update stepper
    this.elements.stepperItems.forEach((item, index) => {
      const step = index + 1;
      item.classList.remove('active', 'completed');
      if (step < stepNumber) {
        item.classList.add('completed');
      } else if (step === stepNumber) {
        item.classList.add('active');
      }
    });
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
    textEl.innerHTML = message;
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
// STEP HANDLERS
// ============================================================================

const AuthStep = {
  async init() {
    // Check if already authenticated
    const { leethub_token: token } = await Storage.get([STORAGE_KEYS.TOKEN]);
    if (token) {
      const user = await GitHubAPI.validateToken(token);
      if (user) {
        await Storage.set({ [STORAGE_KEYS.USERNAME]: user.login });
        UI.showStep(2);
        RepoStep.init();
        return;
      }
      // Token invalid
      await Storage.set({ [STORAGE_KEYS.TOKEN]: null });
    }

    UI.elements.authBtn.addEventListener('click', () => this.handleAuth());
  },

  handleAuth() {
    if (typeof oAuth2 !== 'undefined' && oAuth2.begin) {
      UI.setButtonLoading(UI.elements.authBtn, true);
      oAuth2.begin();
    } else {
      UI.showError(UI.elements.authError, 'Authentication not available. Please refresh the page.');
    }
  }
};

const RepoStep = {
  selectedOption: null,
  username: null,

  async init() {
    // Load username
    const { leethub_username: username } = await Storage.get([STORAGE_KEYS.USERNAME]);
    this.username = username;

    // Set suggested name
    const suggested = document.getElementById('suggested-name');
    if (suggested && username) {
      suggested.textContent = `algosync-${username.toLowerCase()}-solutions`;
    }

    // Setup option cards
    this.setupOptionCards();
    this.setupRepoNameInput();
    this.setupContinueButton();
  },

  setupOptionCards() {
    UI.elements.optionCards.forEach(card => {
      card.addEventListener('click', () => {
        const input = card.querySelector('input[type="radio"]');
        if (input) {
          input.checked = true;
          this.handleOptionChange(input.value);
        }
      });

      // Keyboard support
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    });

    // Also listen to radio changes directly
    UI.elements.repoOptions.forEach(radio => {
      radio.addEventListener('change', (e) => this.handleOptionChange(e.target.value));
    });
  },

  handleOptionChange(value) {
    this.selectedOption = value;

    // Update visual state
    UI.elements.optionCards.forEach(card => {
      const input = card.querySelector('input[type="radio"]');
      if (input) {
        card.classList.toggle('selected', input.checked);
      }
    });

    // Show name input
    UI.elements.nameSection.hidden = false;

    // Update prefix and placeholder
    this.updateNameInputUI();

    // Enable continue if name is valid
    this.validateAndEnableContinue();
  },

  updateNameInputUI() {
    const input = UI.elements.repoNameInput;
    const prefix = UI.elements.namePrefix;
    const hint = UI.elements.nameHint;

    if (this.selectedOption === 'new') {
      prefix.textContent = '';
      input.placeholder = 'algosync-solutions';
      hint.textContent = 'Auto-generated if left empty (lowercase, hyphens allowed)';
      input.required = false;
    } else {
      if (this.username) {
        prefix.textContent = `${this.username}/`;
      } else {
        prefix.textContent = '';
      }
      input.placeholder = 'my-existing-repo';
      hint.textContent = 'Enter the repository name (format: owner/repo or just repo name)';
      input.required = true;
    }

    input.value = '';
    UI.hideError(UI.elements.nameError);
    UI.elements.continueBtn.disabled = true;
  },

  setupRepoNameInput() {
    const input = UI.elements.repoNameInput;

    input.addEventListener('input', () => this.validateAndEnableContinue());
    input.addEventListener('blur', () => this.validateRepoName());
  },

  validateRepoName() {
    const name = UI.elements.repoNameInput.value.trim();

    if (this.selectedOption === 'new') {
      // Optional for new repo - will auto-generate
      UI.hideError(UI.elements.nameError);
      return true;
    }

    if (!name) {
      this.showNameError('Repository name is required');
      return false;
    }

    // Check for owner/repo format or just repo name
    if (name.includes('/')) {
      const parts = name.split('/');
      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        this.showNameError('Invalid format. Use owner/repo or just repo name');
        return false;
      }
      if (!/^[a-zA-Z0-9_.-]+$/.test(parts[0]) || !/^[a-zA-Z0-9_.-]+$/.test(parts[1])) {
        this.showNameError('Only alphanumeric, underscore, hyphen, and dot allowed');
        return false;
      }
    } else {
      if (!/^[a-zA-Z0-9_.-]+$/.test(name)) {
        this.showNameError('Only alphanumeric, underscore, hyphen, and dot allowed');
        return false;
      }
    }

    if (name.length > 100) {
      this.showNameError('Name too long (max 100 characters)');
      return false;
    }

    UI.hideError(UI.elements.nameError);
    return true;
  },

  showNameError(message) {
    UI.elements.nameError.textContent = message;
    UI.elements.nameError.hidden = false;
  },

  validateAndEnableContinue() {
    const isValid = this.validateRepoName();
    UI.elements.continueBtn.disabled = !isValid || !this.selectedOption;
  },

  setupContinueButton() {
    UI.elements.continueBtn.addEventListener('click', () => this.handleContinue());
  },

  async handleContinue() {
    if (!this.validateRepoName()) {
      UI.elements.repoNameInput.focus();
      return;
    }

    UI.hideError(UI.elements.repoError);
    UI.hideError(UI.elements.repoSuccess);
    UI.setButtonLoading(UI.elements.continueBtn, true);

    try {
      const { leethub_token: token } = await Storage.get([STORAGE_KEYS.TOKEN]);
      if (!token) {
        throw new Error('Not authenticated. Please connect GitHub first.');
      }

      const name = UI.elements.repoNameInput.value.trim();

      if (this.selectedOption === 'new') {
        await this.createRepo(token, name);
      } else {
        if (!this.username) {
          throw new Error('Username not found. Please re-authenticate.');
        }
        await this.linkRepo(token, this.username, name);
      }
    } catch (error) {
      UI.showError(UI.elements.repoError, error.message);
    } finally {
      UI.setButtonLoading(UI.elements.continueBtn, false);
    }
  },

  async createRepo(token, name) {
    const repoName = name || `algosync-${(this.username || 'user').toLowerCase()}-solutions`;
    const result = await GitHubAPI.createRepo(token, repoName);

    if (!result.ok) {
      const errorMessages = {
        304: 'Unable to modify repository. Try again later!',
        400: 'Bad request. Make sure you\'re not overriding any existing scripts.',
        401: 'Unauthorized access. Try again later!',
        403: 'Forbidden access to repository. Try again later!',
        422: 'Repository may already exist. Try linking instead.'
      };
      throw new Error(errorMessages[result.status] || `Error creating repository: ${result.data.message || 'Unknown error'}`);
    }

    await Storage.set({
      [STORAGE_KEYS.MODE_TYPE]: 'commit',
      [STORAGE_KEYS.REPO_HOOK]: result.data.full_name,
      [STORAGE_KEYS.REPO_URL]: result.data.html_url
    });

    await Storage.remove([STORAGE_KEYS.STATS]);

    // Upload the professional root README.md to the newly created repo.
    // This is fire-and-forget so it doesn't block the onboarding UI.
    uploadRootReadme(token, result.data.full_name).catch(err => {
      console.warn('[AlgoSync] Root README upload during repo creation failed:', err);
    });

    UI.showSuccess(UI.elements.repoSuccess,
      `Successfully created <a target="_blank" href="${result.data.html_url}">${repoName}</a>. Redirecting...`
    );

    setTimeout(() => this.transitionToSuccess(result.data), 1500);
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

    await Storage.set({
      [STORAGE_KEYS.MODE_TYPE]: 'commit',
      [STORAGE_KEYS.REPO_HOOK]: result.data.full_name,
      [STORAGE_KEYS.REPO_URL]: result.data.html_url
    });

    const { sync_stats: syncStats } = await Storage.get([STORAGE_KEYS.SYNC_STATS]);
    if (syncStats) {
      await this.syncStats(token, result.data.full_name);
    }

    UI.showSuccess(UI.elements.repoSuccess,
      `Successfully linked <a target="_blank" href="${result.data.html_url}">${result.normalized}</a> to AlgoSync!`
    );

    setTimeout(() => this.transitionToSuccess(result.data), 1500);
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
      }
    } catch (e) {
      console.warn('Failed to sync stats:', e);
    }
  },

  transitionToSuccess(repoData) {
    UI.showStep(3);
    SuccessStep.init(repoData);
  }
};

const SuccessStep = {
  init(repoData) {
    const normalized = normalizeGitHubRepoName(repoData.full_name);
    const repoLink = document.createElement('a');
    repoLink.href = getGitHubRepoUrl(normalized);
    repoLink.target = '_blank';
    repoLink.rel = 'noopener noreferrer';
    repoLink.className = 'text-link';
    repoLink.textContent = normalized;

    const container = document.getElementById('success-repo');
    if (container) {
      container.innerHTML = '';
      container.appendChild(repoLink);
    }

    // Open popup button
    const openPopupBtn = document.getElementById('open-popup');
    if (openPopupBtn) {
      openPopupBtn.addEventListener('click', () => {
        // Try to close this tab and open popup
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          chrome.runtime.sendMessage({ action: 'openPopup' });
        }
        window.close();
      });
    }
  }
};

// ============================================================================
// OAUTH2 INTEGRATION
// ============================================================================

window.oAuth2 = window.oAuth2 || {
  begin: () => console.warn('oAuth2 not loaded')
};

// ============================================================================
// MAIN INITIALIZATION
// ============================================================================

async function init() {
  Theme.init();
  UI.cacheElements();

  // Check auth status
  const { leethub_token: token } = await Storage.get([STORAGE_KEYS.TOKEN]);

  if (!token) {
    UI.showStep(1);
    await AuthStep.init();
    return;
  }

  const user = await GitHubAPI.validateToken(token);

  if (!user) {
    await Storage.set({ [STORAGE_KEYS.TOKEN]: null });
    UI.showStep(1);
    await AuthStep.init();
    return;
  }

  await Storage.set({ [STORAGE_KEYS.USERNAME]: user.login });

  const { mode_type: modeType } = await Storage.get([STORAGE_KEYS.MODE_TYPE]);

  if (modeType === 'commit') {
    const { leethub_hook: hook } = await Storage.get([STORAGE_KEYS.REPO_HOOK]);
    if (hook) {
      try {
        await GitHubAPI.linkRepo(token, hook);
        // Already set up - show success or redirect to popup
        UI.showStep(3);
        await SuccessStep.init({ full_name: hook, html_url: getGitHubRepoUrl(hook) });
      } catch {
        await Storage.set({ [STORAGE_KEYS.MODE_TYPE]: 'hook', [STORAGE_KEYS.REPO_HOOK]: null });
        UI.showStep(2);
        await RepoStep.init();
      }
    } else {
      UI.showStep(2);
      await RepoStep.init();
    }
  } else {
    UI.showStep(2);
    await RepoStep.init();
  }
}

document.addEventListener('DOMContentLoaded', init);