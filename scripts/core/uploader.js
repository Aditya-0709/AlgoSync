import {
  DIFFICULTY,
  getBrowser,
  getDifficulty,
  getPlatformProblemDirectory,
  isEmptyObject,
  LeetHubError,
  normalizeGitHubRepoName,
} from './util.js';

const OVERWRITE_SOLUTION_MODE = 'overwrite';
const MULTI_SOLUTION_MODE = 'multi';
const DEFAULT_SOLUTION_UPLOAD_MODE = OVERWRITE_SOLUTION_MODE;

/* Solution Type Picker Constants */
const SOLUTION_TYPE_STORAGE_KEY = 'solution_type_picker_last_selection';
const SOLUTION_TYPES = {
  BRUTE_FORCE: 'brute_force',
  BETTER: 'better',
  OPTIMAL: 'optimal',
  CUSTOM: 'custom',
};
const SOLUTION_TYPE_LABELS = {
  [SOLUTION_TYPES.BRUTE_FORCE]: '🟢 Brute Force',
  [SOLUTION_TYPES.BETTER]: '🟡 Better',
  [SOLUTION_TYPES.OPTIMAL]: '🔵 Optimal',
  [SOLUTION_TYPES.CUSTOM]: '⚪ Custom',
};
const SOLUTION_TYPE_FILENAMES = {
  [SOLUTION_TYPES.BRUTE_FORCE]: 'BruteForce',
  [SOLUTION_TYPES.BETTER]: 'Better',
  [SOLUTION_TYPES.OPTIMAL]: 'Optimal',
};

const WAIT_FOR_GITHUB_API_TO_NOT_THROW_409_MS = 500;
const api = getBrowser();

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function githubFetch(url, options) {
  return new Promise((resolve, reject) => {
    try {
      api.runtime.sendMessage(
        { type: 'GITHUB_API_REQUEST', url, options },
        async response => {
          if (api.runtime.lastError || !response) {
            try {
              const res = await fetch(url, options);
              const text = await res.text();
              let body = null;
              try {
                body = JSON.parse(text);
              } catch (_e) {
                body = text;
              }
              resolve({
                ok: res.ok,
                status: res.status,
                json: async () => body,
                text: async () => text,
              });
            } catch (err) {
              reject(err);
            }
            return;
          }

          resolve({
            ok: response.ok,
            status: response.status,
            json: async () => response.body,
            text: async () =>
              typeof response.body === 'string'
                ? response.body
                : JSON.stringify(response.body),
          });
        }
      );
    } catch (e) {
      fetch(url, options)
        .then(async res => {
          const text = await res.text();
          let body = null;
          try {
            body = JSON.parse(text);
          } catch (_e) {
            body = text;
          }
          resolve({
            ok: res.ok,
            status: res.status,
            json: async () => body,
            text: async () => text,
          });
        })
        .catch(reject);
    }
  });
}

/** Decodes a base64 encoded string into UTF-8 format.*/
const decode = data => {
  try {
    const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (_e) {
    return decodeURIComponent(escape(atob(data)));
  }
};

/** Encodes a given string into base64 format.*/
const encode = data => {
  try {
    const bytes = new TextEncoder().encode(data);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (_e) {
    return btoa(unescape(encodeURIComponent(data)));
  }
};

const getSolutionUploadMode = () => {
  return api.storage.local
    .get('solution_upload_mode')
    .then(({ solution_upload_mode }) => solution_upload_mode || DEFAULT_SOLUTION_UPLOAD_MODE);
};

const getPath = (problemDirectory, filename) => {
  const cleanDir = (problemDirectory || '').replace(/^\/+|\/+$/g, '');
  const cleanFile = (filename || '').replace(/^\/+/, '');
  if (!cleanDir) return cleanFile;
  return cleanFile ? `${cleanDir}/${cleanFile}` : cleanDir;
};

// Returns stats object. If it didn't exist, initializes stats with default difficulty values and initializes the sha object for problem
const getAndInitializeStats = problemKey => {
  return api.storage.local.get('stats').then(({ stats }) => {
    if (stats == null || isEmptyObject(stats)) {
      stats = {};
      stats.shas = {};
      stats.solved = 0;
      stats.easy = 0;
      stats.medium = 0;
      stats.hard = 0;
    }

    if (stats.shas == null) {
      stats.shas = {};
    }

    if (problemKey && stats.shas[problemKey] == null) {
      stats.shas[problemKey] = {};
    }

    return stats;
  });
};

/**
 * Increment the statistics for a given problem based on its difficulty.
 */
const incrementStats = (difficulty, problemKey) => {
  const diff = getDifficulty(difficulty);
  return api.storage.local.get('stats').then(({ stats }) => {
    stats.solved += 1;
    stats.easy += diff === DIFFICULTY.EASY ? 1 : 0;
    stats.medium += diff === DIFFICULTY.MEDIUM ? 1 : 0;
    stats.hard += diff === DIFFICULTY.HARD ? 1 : 0;
    if (!stats.shas) {
      stats.shas = {};
    }
    if (!stats.shas[problemKey]) {
      stats.shas[problemKey] = {};
    }
    stats.shas[problemKey].difficulty = diff.toLowerCase();
    api.storage.local.set({ stats });
    return stats;
  });
};

/**
 * Uploads content to a specified GitHub repository and updates local stats with the sha of the updated file.
 */
const upload = async (token, hook, content, problemDirectory, filename, sha, message) => {
  const path = getPath(problemDirectory, filename);
  const repo = normalizeGitHubRepoName(hook);
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const URL = `https://api.github.com/repos/${repo}/contents/${encodedPath}`;

  let data = {
    message,
    content,
    ...(sha ? { sha } : {}),
  };

  let options = {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
    body: JSON.stringify(data),
  };

  const res = await githubFetch(URL, options);
  if (!res.ok) {
    throw new LeetHubError(String(res.status), { cause: res });
  }
  console.log(`Successfully committed ${path} to github`);

  const body = await res.json();
  const stats = await getAndInitializeStats(problemDirectory);
  if (problemDirectory) {
    stats.shas[problemDirectory][filename] = body.content.sha;
  } else {
    if (!stats.shas[filename]) stats.shas[filename] = {};
    stats.shas[filename][''] = body.content.sha;
  }
  api.storage.local.set({ stats });

  return body.content.sha;
};

async function getGitHubFile(token, hook, directory, filename) {
  const path = getPath(directory, filename);
  const repo = normalizeGitHubRepoName(hook);
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const URL = `https://api.github.com/repos/${repo}/contents/${encodedPath}`;

  let options = {
    method: 'GET',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  };

  const res = await githubFetch(URL, options);
  if (!res.ok) {
    throw new Error(String(res.status));
  }

  return res;
}

async function getGitHubDirectoryContents(token, hook, directory) {
  const repo = normalizeGitHubRepoName(hook);
  const cleanDir = (directory || '').replace(/^\/+|\/+$/g, '');
  const encodedDir = cleanDir ? cleanDir.split('/').map(encodeURIComponent).join('/') : '';
  const URL = `https://api.github.com/repos/${repo}/contents/${encodedDir}`;

  let options = {
    method: 'GET',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  };

  const res = await githubFetch(URL, options);
  if (res.status === 404) {
    return [];
  }
  if (!res.ok) {
    throw new Error(String(res.status));
  }

  return res.json();
}

async function getNextAvailableFilename(problemDirectory, baseFilename, extension) {
  const { leethub_token: token, leethub_hook: hook } = await api.storage.local.get([
    'leethub_token',
    'leethub_hook',
  ]);

  const files = await getGitHubDirectoryContents(token, hook, problemDirectory);
  const pattern = new RegExp(`^${escapeRegExp(baseFilename)}(\\d*)${escapeRegExp(extension)}$`);

  let highestNumber = 0;
  let baseExists = false;

  for (const file of files) {
    if (file.type !== 'file') continue;
    const match = file.name.match(pattern);
    if (match) {
      if (match[1] === '') {
        baseExists = true;
      } else {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > highestNumber) {
          highestNumber = num;
        }
      }
    }
  }

  if (!baseExists) {
    return `${baseFilename}${extension}`;
  }

  const nextNumber = highestNumber === 0 ? 2 : highestNumber + 1;
  return `${baseFilename}${nextNumber}${extension}`;
}

async function getNextMultiSolutionFilename(problemDirectory, extension) {
  const { leethub_token: token, leethub_hook: hook } = await api.storage.local.get([
    'leethub_token',
    'leethub_hook',
  ]);

  const files = await getGitHubDirectoryContents(token, hook, problemDirectory);
  const solutionPattern = new RegExp(`^Solution(\\d+)${escapeRegExp(extension)}$`);

  const highestSolutionNumber = files.reduce((highest, file) => {
    if (file.type !== 'file') {
      return highest;
    }

    const match = file.name.match(solutionPattern);
    if (!match) {
      return highest;
    }

    return Math.max(highest, Number(match[1]));
  }, 0);

  return `Solution${highestSolutionNumber + 1}${extension}`;
}

function showSolutionTypePickerModal() {
  return new Promise(async resolve => {
    const lastSelection =
      (await api.storage.local.get(SOLUTION_TYPE_STORAGE_KEY))[SOLUTION_TYPE_STORAGE_KEY] ||
      SOLUTION_TYPES.BRUTE_FORCE;

    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'leethub-solution-picker-overlay';
    modalOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    `;

    const modalContainer = document.createElement('div');
    modalContainer.style.cssText = `
      background: #1e1e1e;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 24px;
      width: 360px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      color: #fff;
    `;

    modalContainer.innerHTML = `
      <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #fff;">Select Solution Type</h3>
      <p style="margin: 0 0 20px 0; font-size: 13px; color: #a0a0a0;">Choose how to categorize and name this submission on GitHub</p>
      
      <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
        ${Object.entries(SOLUTION_TYPE_LABELS)
          .map(
            ([type, label]) => `
          <label style="
            display: flex;
            align-items: center;
            padding: 12px 16px;
            border: 2px solid ${type === lastSelection ? '#2cbb5d' : '#333'};
            border-radius: 8px;
            cursor: pointer;
            background: ${type === lastSelection ? 'rgba(44, 187, 93, 0.1)' : '#262626'};
            transition: all 0.2s ease;
          ">
            <input type="radio" name="leethub-solution-type" value="${type}" ${
              type === lastSelection ? 'checked' : ''
            } style="margin-right: 12px; cursor: pointer;">
            <span style="font-size: 14px; font-weight: 500;">${label}</span>
          </label>
        `
          )
          .join('')}
      </div>

      <div id="leethub-custom-name-section" style="
        display: ${lastSelection === SOLUTION_TYPES.CUSTOM ? 'block' : 'none'};
        margin-bottom: 20px;
      ">
        <label style="display: block; font-size: 13px; color: #a0a0a0; margin-bottom: 8px;">Custom filename (without extension):</label>
        <input type="text" id="leethub-custom-name-input" placeholder="e.g. TwoPointer, SlidingWindow" style="
          width: 100%;
          padding: 10px 14px;
          border: 2px solid #333;
          border-radius: 8px;
          background: #262626;
          color: #fff;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s ease;
        ">
        <p style="margin: 6px 0 0 0; font-size: 11px; color: #666;">Letters, numbers, hyphens and underscores only</p>
      </div>

      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="leethub-picker-cancel" style="
          padding: 8px 16px;
          border: 1px solid #444;
          border-radius: 6px;
          background: transparent;
          color: #a0a0a0;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        ">Cancel</button>
        <button id="leethub-picker-submit" style="
          padding: 8px 20px;
          border: none;
          border-radius: 6px;
          background: #2cbb5d;
          color: #fff;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        ">Upload</button>
      </div>
    `;

    modalOverlay.appendChild(modalContainer);
    document.body.appendChild(modalOverlay);

    const customSection = modalContainer.querySelector('#leethub-custom-name-section');
    const customInput = modalContainer.querySelector('#leethub-custom-name-input');

    // Focus styling for custom input
    customInput.addEventListener('focus', () => {
      customInput.style.borderColor = '#2cbb5d';
    });
    customInput.addEventListener('blur', () => {
      customInput.style.borderColor = '#333';
    });

    const radioLabels = modalContainer.querySelectorAll('label');
    radioLabels.forEach(label => {
      const radio = label.querySelector('input[type="radio"]');
      if (!radio) return;
      label.addEventListener('click', () => {
        radioLabels.forEach(l => {
          if (l.querySelector('input[type="radio"]')) {
            l.style.borderColor = '#333';
            l.style.background = '#262626';
          }
        });
        label.style.borderColor = '#2cbb5d';
        label.style.background = 'rgba(44, 187, 93, 0.1)';
        radio.checked = true;

        // Show/hide custom name input
        if (radio.value === SOLUTION_TYPES.CUSTOM) {
          customSection.style.display = 'block';
          customInput.focus();
        } else {
          customSection.style.display = 'none';
        }
      });
    });

    const cleanup = () => {
      if (modalOverlay.parentNode) {
        modalOverlay.parentNode.removeChild(modalOverlay);
      }
    };

    const cancelBtn = modalContainer.querySelector('#leethub-picker-cancel');
    const submitBtn = modalContainer.querySelector('#leethub-picker-submit');

    cancelBtn.addEventListener('click', () => {
      cleanup();
      resolve(null);
    });

    submitBtn.addEventListener('click', async () => {
      const selectedType = modalContainer.querySelector(
        'input[name="leethub-solution-type"]:checked'
      ).value;
      await api.storage.local.set({ [SOLUTION_TYPE_STORAGE_KEY]: selectedType });

      let customName = null;
      if (selectedType === SOLUTION_TYPES.CUSTOM) {
        const raw = customInput.value.trim().replace(/[^a-zA-Z0-9_-]/g, '');
        if (raw) {
          customName = raw;
        }
      }

      cleanup();
      resolve({ type: selectedType, customName });
    });

    modalOverlay.addEventListener('click', e => {
      if (e.target === modalOverlay) {
        cleanup();
        resolve(null);
      }
    });
  });
}

async function getSolutionFilename(problemDirectory, extension, solutionUploadMode) {
  if (solutionUploadMode === MULTI_SOLUTION_MODE) {
    const result = await showSolutionTypePickerModal();
    if (result === null) {
      return null; // User cancelled
    }

    const { type: selectedType, customName } = result;

    if (selectedType === SOLUTION_TYPES.CUSTOM) {
      if (customName) {
        // Use the user-provided custom name
        return getNextAvailableFilename(problemDirectory, customName, extension);
      }
      // Fallback to auto-incrementing Solution1, Solution2, etc.
      return getNextMultiSolutionFilename(problemDirectory, extension);
    }

    const baseFilename = SOLUTION_TYPE_FILENAMES[selectedType];
    return getNextAvailableFilename(problemDirectory, baseFilename, extension);
  }

  return `Solution${extension}`;
}

/**
 * Uploads code or README to GitHub under platform-specific DSA directory.
 * Automatically handles 409 conflicts and Multi-Solution Mode naming.
 */
async function uploadGitWith409Retry(code, problemSlug, filename, commitMsg, optionals, platformFolder = 'LeetCode') {
  const storageData = await api.storage.local.get([
    'leethub_token',
    'mode_type',
    'leethub_hook',
    'stats',
    'auto_sync_enabled',
    'auto_readme_enabled',
  ]);

  if (storageData.auto_sync_enabled === false) {
    console.log('[AlgoSync] Auto sync is disabled by user in Settings. Skipping upload.');
    return null;
  }

  if (filename === 'README.md' && storageData.auto_readme_enabled === false) {
    console.log('[AlgoSync] Auto README is disabled by user in Settings. Skipping README upload.');
    return null;
  }

  const token = storageData.leethub_token;
  if (!token) {
    throw new LeetHubError('LeethubTokenUndefined');
  }

  if (storageData.mode_type !== 'commit') {
    throw new LeetHubError('LeetHubNotAuthorizedByGit');
  }

  let hook = storageData.leethub_hook;
  if (!hook) {
    throw new LeetHubError('NoRepoDefined');
  }
  hook = normalizeGitHubRepoName(hook);

  // Construct structured directory e.g. DSA/LeetCode/0001-two-sum
  const fullProblemDirectory = getPlatformProblemDirectory(platformFolder, problemSlug);

  const sha = optionals?.sha
    ? optionals.sha
    : storageData.stats?.shas?.[fullProblemDirectory]?.[filename] !== undefined
    ? storageData.stats.shas[fullProblemDirectory][filename]
    : storageData.stats?.shas?.[problemSlug]?.[filename] !== undefined
    ? storageData.stats.shas[problemSlug][filename]
    : '';

  try {
    return await upload(
      token,
      hook,
      code,
      fullProblemDirectory,
      filename,
      sha,
      commitMsg
    );
  } catch (err) {
    if (err.message === '409' || err.message === '422' || err.message === '404') {
      if (optionals?.neverOverwrite && err.message !== '404') {
        const extIndex = filename.lastIndexOf('.');
        const basePart = extIndex !== -1 ? filename.slice(0, extIndex) : filename;
        const extPart = extIndex !== -1 ? filename.slice(extIndex) : '';
        const baseNameWithoutDigits = basePart.replace(/\d+$/, '');

        let nextFilename = await getNextAvailableFilename(fullProblemDirectory, baseNameWithoutDigits, extPart);
        if (nextFilename === filename) {
          const currentNumMatch = basePart.match(/\d+$/);
          const currentNum = currentNumMatch ? parseInt(currentNumMatch[0], 10) : 1;
          nextFilename = `${baseNameWithoutDigits}${currentNum + 1}${extPart}`;
        }

        return await uploadGitWith409Retry(code, problemSlug, nextFilename, commitMsg, optionals, platformFolder);
      }
      try {
        const data = await getGitHubFile(token, hook, fullProblemDirectory, filename).then(res =>
          res.json()
        );
        return await upload(
          token,
          hook,
          code,
          fullProblemDirectory,
          filename,
          data.sha,
          commitMsg
        );
      } catch (fileErr) {
        if ((fileErr.message === '404' || err.message === '404') && sha) {
          return await upload(
            token,
            hook,
            code,
            fullProblemDirectory,
            filename,
            '',
            commitMsg
          );
        }
        throw fileErr;
      }
    }
    throw err;
  }
}

export {
  DEFAULT_SOLUTION_UPLOAD_MODE,
  decode,
  encode,
  escapeRegExp,
  getAndInitializeStats,
  getGitHubDirectoryContents,
  getGitHubFile,
  getNextAvailableFilename,
  getNextMultiSolutionFilename,
  getPath,
  getSolutionFilename,
  getSolutionUploadMode,
  incrementStats,
  MULTI_SOLUTION_MODE,
  OVERWRITE_SOLUTION_MODE,
  showSolutionTypePickerModal,
  SOLUTION_TYPE_FILENAMES,
  SOLUTION_TYPE_LABELS,
  SOLUTION_TYPES,
  upload,
  uploadGitWith409Retry,
  WAIT_FOR_GITHUB_API_TO_NOT_THROW_409_MS,
};
