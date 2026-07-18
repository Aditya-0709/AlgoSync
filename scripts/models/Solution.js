/**
 * Solution Domain Model
 * Represents a user's code solution across platforms and encapsulates solution naming/type logic.
 */
import { storageService } from '../services/storageService.js';
import {
  getNextAvailableFilename,
  getNextMultiSolutionFilename,
} from '../github/uploader.js';

/** Enum for languages supported across coding platforms. */
export const languages = Object.freeze({
  C: '.c',
  'C++': '.cpp',
  'C#': '.cs',
  Dart: '.dart',
  Elixir: '.ex',
  Erlang: '.erl',
  Go: '.go',
  Java: '.java',
  JavaScript: '.js',
  Javascript: '.js',
  Kotlin: '.kt',
  MySQL: '.sql',
  'MS SQL Server': '.sql',
  Oracle: '.sql',
  Pandas: '.py',
  PHP: '.php',
  Python: '.py',
  Python3: '.py',
  Racket: '.rkt',
  Ruby: '.rb',
  Rust: '.rs',
  Scala: '.scala',
  Swift: '.swift',
  TypeScript: '.ts',
});

export const OVERWRITE_SOLUTION_MODE = 'overwrite';
export const MULTI_SOLUTION_MODE = 'multi';
export const DEFAULT_SOLUTION_UPLOAD_MODE = OVERWRITE_SOLUTION_MODE;

const SOLUTION_TYPE_STORAGE_KEY = 'solution_type_picker_last_selection';
export const SOLUTION_TYPES = {
  BRUTE_FORCE: 'brute_force',
  BETTER: 'better',
  OPTIMAL: 'optimal',
  CUSTOM: 'custom',
};
export const SOLUTION_TYPE_LABELS = {
  [SOLUTION_TYPES.BRUTE_FORCE]: '🟢 Brute Force',
  [SOLUTION_TYPES.BETTER]: '🟡 Better',
  [SOLUTION_TYPES.OPTIMAL]: '🔵 Optimal',
  [SOLUTION_TYPES.CUSTOM]: '⚪ Custom',
};
export const SOLUTION_TYPE_FILENAMES = {
  [SOLUTION_TYPES.BRUTE_FORCE]: 'BruteForce',
  [SOLUTION_TYPES.BETTER]: 'Better',
  [SOLUTION_TYPES.OPTIMAL]: 'Optimal',
};

export async function getSolutionUploadMode() {
  const { solution_upload_mode } = await storageService.get(['solution_upload_mode']);
  return solution_upload_mode || DEFAULT_SOLUTION_UPLOAD_MODE;
}

export function showSolutionTypePickerModal() {
  return new Promise(async resolve => {
    const stored = await storageService.get([SOLUTION_TYPE_STORAGE_KEY]);
    const storedSelection = stored[SOLUTION_TYPE_STORAGE_KEY];
    const lastSelection = Object.values(SOLUTION_TYPES).includes(storedSelection)
      ? storedSelection
      : SOLUTION_TYPES.BRUTE_FORCE;

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
      const selectedRadio = modalContainer.querySelector(
        'input[name="leethub-solution-type"]:checked'
      );
      const selectedType = selectedRadio?.value || SOLUTION_TYPES.BRUTE_FORCE;
      await storageService.set({ [SOLUTION_TYPE_STORAGE_KEY]: selectedType });

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

export async function getSolutionFilename(problemDirectory, extension, solutionUploadMode) {
  if (solutionUploadMode === MULTI_SOLUTION_MODE) {
    const result = await showSolutionTypePickerModal();
    if (result === null) {
      return null;
    }

    const { type: selectedType, customName } = result;

    if (selectedType === SOLUTION_TYPES.CUSTOM) {
      if (customName) {
        return getNextAvailableFilename(problemDirectory, customName, extension);
      }
      return getNextMultiSolutionFilename(problemDirectory, extension);
    }

    const baseFilename = SOLUTION_TYPE_FILENAMES[selectedType];
    return getNextAvailableFilename(problemDirectory, baseFilename, extension);
  }

  return `Solution${extension}`;
}

export class Solution {
  constructor({
    problemSlug = '',
    code = '',
    language = '',
    extension = '',
    filename = '',
    uploadMode = OVERWRITE_SOLUTION_MODE,
    stats = null,
  } = {}) {
    this.problemSlug = problemSlug;
    this.code = code;
    this.language = language;
    this.extension = extension || (language ? languages[language] || '' : '');
    this.filename = filename;
    this.uploadMode = uploadMode;
    this.stats = stats;
  }
}

export default Solution;
