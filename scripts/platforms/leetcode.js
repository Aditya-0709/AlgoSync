import { CodingPlatform } from './base.js';
import {
  decode,
  encode,
  getGitHubFile,
  getSolutionFilename,
  getSolutionUploadMode,
  incrementStats,
  MULTI_SOLUTION_MODE,
  upload,
  uploadGitWith409Retry,
  WAIT_FOR_GITHUB_API_TO_NOT_THROW_409_MS,
} from '../core/uploader.js';
import {
  debounce,
  delay,
  getBrowser,
  getPlatformProblemDirectory,
  LeetHubError,
  normalizeGitHubRepoName,
} from '../core/util.js';
import { LeetCodeV1, LeetCodeV2 } from '../leetcode/versions.js';
import setupManualSubmitBtn from '../leetcode/submitBtn.js';
import { appendProblemToReadme, sortTopicsInReadme, updatePlatformAndRootReadme } from '../leetcode/readmeTopics.js';

const readmeMsg = 'Create README - AlgoSync';
const updateReadmeMsg = 'Update README - Topic Tags';
const updateStatsMsg = 'Updated stats';
const discussionMsg = 'Prepend discussion post - AlgoSync';
const createNotesMsg = 'Attach NOTES - AlgoSync';
const defaultRepoReadme =
  'A collection of LeetCode questions to ace the coding interview! - Created using [AlgoSync](https://github.com/arunbhardwaj/LeetHub-2.0)';
const readmeFilename = 'README.md';
const statsFilename = 'stats.json';

const api = getBrowser();

export class LeetCodePlatform extends CodingPlatform {
  constructor() {
    super({
      id: 'leetcode',
      name: 'LeetCode',
      folder: 'LeetCode',
      hostnames: ['leetcode.com', 'cn.leetcode.com'],
    });
  }

  init() {
    /* Sync to local storage */
    api.storage.local.get('isSync', data => {
      const keys = [
        'leethub_token',
        'leethub_username',
        'pipe_leethub',
        'stats',
        'leethub_hook',
        'mode_type',
        'solution_upload_mode',
      ];
      if (!data || !data.isSync) {
        keys.forEach(key => {
          api.storage.sync.get(key, syncData => {
            if (syncData && syncData[key] !== undefined) {
              api.storage.local.set({ [key]: syncData[key] });
            }
          });
        });
        api.storage.local.set({ isSync: true }, () => {
          console.log('AlgoSync Synced to local values');
        });
      } else {
        console.log('AlgoSync Local storage already synced!');
      }
    });

    setupManualSubmitBtn(
      debounce(
        () => {
          const leetCode = new LeetCodeV2();
          const match = window.location.href.match(/leetcode\.com\/.*\/submissions\/(?:detail\/)?(\d+)/);
          if (match && match[1]) {
            leetCode.submissionId = match[1];
          }
          this.loader(leetCode);
          return;
        },
        5000,
        true
      )
    );

    const v2SubmissionHandler = (event, leetCode) => {
      if (
        (event.type === 'keydown' && wasSubmittedByKeyboard(event)) ||
        event.type === 'click'
      ) {
        this.loader(leetCode);
      }
    };

    const submitBtnObserver = new MutationObserver((_mutations, observer) => {
      const v1SubmitBtn = document.querySelector('[data-cy="submit-code-btn"]');
      const v2SubmitBtn = document.querySelector(
        '[data-e2e-locator="console-submit-button"]'
      );
      const textarea = document.querySelector('textarea');

      if (v1SubmitBtn) {
        observer.disconnect();
        const leetCode = new LeetCodeV1();
        v1SubmitBtn.addEventListener('click', () => this.loader(leetCode));
        return;
      }

      if (v2SubmitBtn && textarea) {
        observer.disconnect();
        const leetCode = new LeetCodeV2();
        if (!!!v2SubmitBtn.onclick) {
          textarea.addEventListener('keydown', e => v2SubmissionHandler(e, leetCode));
          v2SubmitBtn.onclick = e => v2SubmissionHandler(e, leetCode);
        }
      }
    });

    submitBtnObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  async loader(leetCode) {
    let iterations = 0;
    const intervalId = setInterval(async () => {
      try {
        const isSuccessful =
          typeof leetCode.checkSubmissionSucceeded === 'function'
            ? await leetCode.checkSubmissionSucceeded(iterations)
            : leetCode.getSuccessStateAndUpdate();
        if (!isSuccessful) {
          iterations++;
          if (iterations > 120) {
            clearInterval(intervalId);
          }
          return;
        }

        clearInterval(intervalId);

        const probStats =
          typeof leetCode.getSubmissionDetails === 'function'
            ? await leetCode.getSubmissionDetails()
            : leetCode.parseStats();
        if (!probStats) {
          throw new LeetHubError('SubmissionStatsNotFound');
        }

        const probStatement = leetCode.parseQuestion();
        if (!probStatement) {
          throw new LeetHubError('ProblemStatementNotFound');
        }

        const problemName = leetCode.getProblemNameSlug();
        const fullProblemDirectory = getPlatformProblemDirectory(this.folder, problemName);
        const language = leetCode.getLanguageExtension();
        if (!language) {
          throw new LeetHubError('LanguageNotFound');
        }
        const solutionUploadMode = await getSolutionUploadMode();

        let filename = await getSolutionFilename(
          fullProblemDirectory,
          language,
          solutionUploadMode
        );
        if (!filename) {
          leetCode.markUploadFailed();
          return;
        }

        /* Upload README */
        const uploadReadMe = await api.storage.local.get('stats').then(({ stats }) => {
          const shaExists = stats?.shas?.[fullProblemDirectory]?.[readmeFilename] !== undefined;
          if (!shaExists) {
            return uploadGitWith409Retry(
              encode(probStatement),
              problemName,
              readmeFilename,
              readmeMsg,
              undefined,
              this.folder
            );
          }
        });

        /* Upload Notes if any */
        const notes = leetCode.getNotesIfAny();
        let uploadNotes;
        if (notes != undefined && notes.length > 0) {
          uploadNotes = uploadGitWith409Retry(
            encode(notes),
            problemName,
            'NOTES.md',
            createNotesMsg,
            undefined,
            this.folder
          );
        }

        /* Upload code */
        const code = leetCode.findCode(probStats);
        const uploadCode = uploadGitWith409Retry(
          encode(code),
          problemName,
          filename,
          readmeMsg,
          {
            neverOverwrite: solutionUploadMode === MULTI_SOLUTION_MODE,
          },
          this.folder
        );

        /* Group problem into topics in platform repo README and update Root README */
        const updateRepoReadMe = updatePlatformAndRootReadme(
          leetCode.submissionData?.question?.topicTags,
          fullProblemDirectory,
          problemName,
          typeof leetCode.parseQuestionTitle === 'function' ? leetCode.parseQuestionTitle() : problemName,
          this.folder,
          this.name
        );

        await Promise.all([uploadReadMe, uploadNotes, uploadCode, updateRepoReadMe]);

        leetCode.markUploaded();

        incrementStats(leetCode.difficulty, fullProblemDirectory);
      } catch (err) {
        leetCode.markUploadFailed();
        clearInterval(intervalId);
        if (err && (err.message || String(err)).includes('Extension context invalidated')) {
          console.warn('AlgoSync extension context invalidated. Please refresh the LeetCode page.');
          return;
        }
        if (!(err instanceof LeetHubError)) {
          console.error(err);
          return;
        }
      }
    }, 1000);
  }
}

function wasSubmittedByKeyboard(event) {
  const isEnterKey = event.key === 'Enter';
  const isMacOS = window.navigator.userAgent.includes('Mac');
  return isEnterKey && ((isMacOS && event.metaKey) || (!isMacOS && event.ctrlKey));
}

async function createRepoReadme() {
  const content = encode(defaultRepoReadme);
  return uploadGitWith409Retry(content, '', readmeFilename, readmeMsg);
}
