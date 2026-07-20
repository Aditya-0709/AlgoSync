import { CodingPlatform } from './base.js';
import { encode } from '../github/api.js';
import { uploadGitWith409Retry } from '../github/uploader.js';
import { getSolutionFilename, getSolutionUploadMode, MULTI_SOLUTION_MODE, languages } from '../models/Solution.js';
import { incrementStats } from '../models/Statistics.js';
import { convertToSlug, getBrowser, getPlatformProblemDirectory } from '../utils/helpers.js';
import { updatePlatformAndRootReadme } from '../leetcode/readmeTopics.js';
import { formatGfgProblemReadme } from './gfgReadme.js';
import { extractGfgProblemStatement } from './gfg/problemStatement.js';
import {
  findTitle,
  findDifficulty,
  findTopicTags,
  findGfgLanguage,
  _getCodeFromDOM,
} from '../parsers/gfg/index.js';
import { storageService } from '../services/storageService.js';
import { syncService } from '../services/syncService.js';

const README_MSG = 'Create README - AlgoSync';
const SUBMIT_MSG = 'Added solution - AlgoSync';

export class GeeksForGeeksPlatform extends CodingPlatform {
  constructor() {
    super({
      id: 'geeksforgeeks',
      name: 'GeeksForGeeks',
      folder: 'GeeksForGeeks',
      hostnames: ['practice.geeksforgeeks.org', 'www.geeksforgeeks.org', 'geeksforgeeks.org'],
    });
    this.progressSpinnerElementId = 'leethub_gfg_progress_elem';
    this.progressSpinnerElementClass = 'leethub_gfg_progress';
  }

  injectSpinnerStyle() {
    if (document.getElementById('leethub_gfg_style')) return;
    const style = document.createElement('style');
    style.id = 'leethub_gfg_style';
    style.textContent = `
      .${this.progressSpinnerElementClass} {
        pointer-events: none;
        width: 1.5em;
        height: 1.5em;
        border: 0.3em solid transparent;
        border-color: #eee;
        border-top-color: #3E67EC;
        border-radius: 50%;
        animation: gfg_loadingspin 1s linear infinite;
        display: inline-block;
        vertical-align: middle;
      }
      @keyframes gfg_loadingspin {
        100% { transform: rotate(360deg); }
      }
      .leethub_gfg_success {
        display: inline-block;
        color: #28a745;
        font-weight: bold;
        vertical-align: middle;
      }
      .leethub_gfg_error {
        display: inline-block;
        color: #dc3545;
        font-weight: bold;
        vertical-align: middle;
      }
    `;
    document.head.append(style);
  }

  startSpinner(anchorBtn) {
    this.injectSpinnerStyle();
    let elem = document.getElementById('leethub_gfg_anchor_element');
    if (!elem) {
      elem = document.createElement('span');
      elem.id = 'leethub_gfg_anchor_element';
      elem.style = 'margin-left: 10px; margin-right: 10px; vertical-align: middle;';
      if (anchorBtn && anchorBtn.parentNode) {
        anchorBtn.parentNode.insertBefore(elem, anchorBtn.nextSibling);
      } else {
        document.body.appendChild(elem);
      }
    }
    elem.innerHTML = `<div id="${this.progressSpinnerElementId}" class="${this.progressSpinnerElementClass}" title="AlgoSync uploading..."></div>`;
  }

  markUploaded() {
    const elem = document.getElementById(this.progressSpinnerElementId) || document.getElementById('leethub_gfg_anchor_element');
    if (elem) {
      elem.innerHTML = `<span class="leethub_gfg_success" title="Successfully uploaded to GitHub!">&#10003; Uploaded to GitHub</span>`;
    }
  }

  markUploadFailed() {
    const elem = document.getElementById(this.progressSpinnerElementId) || document.getElementById('leethub_gfg_anchor_element');
    if (elem) {
      elem.innerHTML = `<span class="leethub_gfg_error" title="Upload failed">&#10007; Upload Failed</span>`;
    }
  }

  findGfgLanguage() {
    return findGfgLanguage(document);
  }

  findTitle() {
    return findTitle(document, window.location);
  }

  findDifficulty() {
    return findDifficulty(document);
  }

  async findTopicTags() {
    return findTopicTags(document);
  }

  getProblemStatement(title, difficulty) {
    let content = extractGfgProblemStatement(document);

    const questionUrl = window.location.href.split('?')[0];
    return formatGfgProblemReadme(title, difficulty, content, questionUrl);
  }

  getCode() {
    return new Promise((resolve) => {
      try {
        // Remove any previous extraction result
        const existing = document.getElementById('leethub_code_data');
        if (existing) existing.remove();

        // Inject the file-based extractor script (runs in MAIN world, CSP-compliant)
        const script = document.createElement('script');
        script.src = getBrowser().runtime.getURL('scripts/gfg_code_extractor.js');

        script.onload = () => {
          script.remove();
          const codeElem = document.getElementById('leethub_code_data');
          const code = codeElem ? codeElem.textContent : '';
          if (codeElem) codeElem.remove();

          if (code && code.trim().length > 0) {
            console.log('[AlgoSync] Code extracted via editor API, length:', code.length);
            resolve(code);
          } else {
            console.log('[AlgoSync] Editor API returned empty, falling back to DOM');
            resolve(this._getCodeFromDOM());
          }
        };

        script.onerror = () => {
          console.warn('[AlgoSync] Script injection failed, falling back to DOM');
          script.remove();
          resolve(this._getCodeFromDOM());
        };

        (document.head || document.documentElement).appendChild(script);
      } catch (_e) {
        console.error('[AlgoSync] getCode error:', _e);
        resolve(this._getCodeFromDOM());
      }
    });
  }

  /** DOM-based fallback for code extraction (only gets visible lines). */
  _getCodeFromDOM() {
    return _getCodeFromDOM(document);
  }

  findSubmitButton() {
    try {
      const buttons = document.querySelectorAll('button, div[role="button"], a[role="button"]');
      for (let btn of buttons) {
        const text = (btn.innerText || btn.textContent || '').trim().toLowerCase();
        if (text === 'submit' || text === 'submit code') {
          return btn;
        }
      }
      const xpathBtn = document.evaluate(
        ".//button[contains(.,'Submit')]",
        document.body,
        null,
        XPathResult.ANY_TYPE,
        null
      ).iterateNext();
      if (xpathBtn) return xpathBtn;
    } catch (_e) {}
    return null;
  }

  checkSubmissionSuccess() {
    try {
      const outputContainers = document.querySelectorAll(
        '[class*="problems_content"], [class*="output"], [class*="result"], [class*="submission"], [class*="modal"], [role="alert"], [class*="success"], [class*="verdict"], div, span'
      );
      const successKeywords = [
        'problem solved successfully',
        'all test cases passed',
        'correct answer',
      ];
      for (let el of outputContainers) {
        if (el.children && el.children.length > 15) continue;
        const text = (el.innerText || el.textContent || '').trim().toLowerCase();
        if (successKeywords.some(kw => text.includes(kw))) {
          if (!text.includes('click submit') && !text.includes('to see output')) {
            return true;
          }
        }
      }
    } catch (_e) {}
    return false;
  }

  async startSubmissionMonitor(submitBtn) {
    let START_MONITOR = true;
    this.startSpinner(submitBtn);

    // CRITICAL: Capture ALL DOM-dependent data NOW, BEFORE the success modal appears
    // and potentially overwrites the DOM with "Problem Solved Successfully"
    const cachedTitle = this.findTitle();
    const cachedDifficulty = this.findDifficulty();
    const cachedProblemStatement = this.getProblemStatement(cachedTitle, cachedDifficulty);
    const cachedTopicTags = await this.findTopicTags();
    const cachedLanguage = this.findGfgLanguage() || '.py';
    console.log('[AlgoSync] Cached at submit time — title:', cachedTitle, 'difficulty:', cachedDifficulty, 'tags:', cachedTopicTags, 'lang:', cachedLanguage);

    let attempts = 0;
    const submissionInterval = setInterval(async () => {
      attempts++;
      if (attempts > 180) { // Timeout after 3 minutes
        clearInterval(submissionInterval);
        return;
      }

      if (this.checkSubmissionSuccess() && START_MONITOR) {
        START_MONITOR = false;
        clearInterval(submissionInterval);

        try {
          const title = (cachedTitle && cachedTitle !== 'Unknown Problem') ? cachedTitle : (this.findTitle() || cachedTitle);
          if (!title || title === 'Unknown Problem') {
            const freshTitle = this.findTitle();
            if (!freshTitle || freshTitle === 'Unknown Problem') {
              this.markUploadFailed();
              return;
            }
          }

          const difficulty = (cachedDifficulty && cachedDifficulty !== 'Medium' && cachedDifficulty !== 'Unknown') ? cachedDifficulty : (this.findDifficulty() || cachedDifficulty || 'Medium');
          
          let problemStatement = cachedProblemStatement;
          if (!problemStatement || problemStatement.includes('Unknown Problem') || problemStatement.length < 50) {
            const freshStatement = this.getProblemStatement(title, difficulty);
            if (freshStatement && freshStatement.length >= 50) {
              problemStatement = freshStatement;
            } else if (!problemStatement) {
              problemStatement = freshStatement || formatGfgProblemReadme(title, difficulty, '', window.location.href.split('?')[0]);
            }
          }

          const code = await this.getCode();
          const language = cachedLanguage;
          const problemSlug = `${convertToSlug(title)}-gfg`;
          const fullProblemDirectory = getPlatformProblemDirectory(this.folder, problemSlug);

          let topicTags = cachedTopicTags;
          if (!topicTags || topicTags.length === 0 || (topicTags.length === 1 && topicTags[0]?.name === 'General')) {
            const freshTags = await this.findTopicTags();
            if (freshTags && freshTags.length > 0 && !(freshTags.length === 1 && freshTags[0]?.name === 'General')) {
              topicTags = freshTags;
            }
          }

          const result = await syncService.syncSubmission({
            problemStatement,
            problemSlug,
            problemName: problemSlug,
            fullProblemDirectory,
            language,
            code,
            topicTags,
            problemTitle: title,
            difficulty,
            platformFolder: this.folder,
            platformName: this.name,
            readmeMsg: README_MSG,
            codeMsg: SUBMIT_MSG,
          });

          if (result && result.sha) {
            this.markUploaded();
          } else {
            this.markUploadFailed();
          }
        } catch (err) {
          console.error('[AlgoSync] GFG upload failed:', err);
          this.markUploadFailed();
        }
      }
    }, 1000);
  }

  init() {
    this.injectSpinnerStyle();

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        if (this.match(window.location.href)) {
          const submitBtn = this.findSubmitButton();
          this.startSubmissionMonitor(submitBtn);
        }
      }
    });

    setInterval(() => {
      if (this.match(window.location.href)) {
        const submitBtn = this.findSubmitButton();
        if (submitBtn && !submitBtn.hasAttribute('data-leethub-bound')) {
          submitBtn.setAttribute('data-leethub-bound', 'true');
          submitBtn.addEventListener('click', () => {
            this.startSubmissionMonitor(submitBtn);
          });
        }
      }
    }, 1500);
  }
}
