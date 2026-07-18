/**
 * Sync Service
 * Coordinates the entire workflow:
 * Parser ↓ Generator ↓ GitHub Upload ↓ Statistics ↓ Storage
 * No other module should orchestrate this flow.
 */
import { storageService } from './storageService.js';
import { encode } from '../github/api.js';
import { uploadGitWith409Retry } from '../github/uploader.js';
import { getSolutionFilename, getSolutionUploadMode, MULTI_SOLUTION_MODE } from '../models/Solution.js';
import { incrementStats } from '../models/Statistics.js';
import { updatePlatformAndRootReadme } from '../leetcode/readmeTopics.js';

const README_FILENAME = 'README.md';

const syncService = {
  async syncPlatformAndRootReadme(topicTags, problemDirectory, problemTitle, platformFolder, platformName) {
    return updatePlatformAndRootReadme(
      topicTags,
      problemDirectory,
      problemDirectory.split('/').pop() || problemTitle,
      problemTitle,
      platformFolder,
      platformName
    );
  },

  async syncSubmission({
    problemStatement,
    problemName,
    problemSlug,
    fullProblemDirectory,
    language,
    code,
    notes,
    topicTags,
    problemTitle,
    difficulty,
    platformFolder,
    platformName,
    readmeMsg = 'Create README - AlgoSync',
    codeMsg = 'Create README - AlgoSync',
    createNotesMsg = 'Attach NOTES - AlgoSync',
  }) {
    const solutionUploadMode = await getSolutionUploadMode();
    const filename = await getSolutionFilename(
      fullProblemDirectory,
      language,
      solutionUploadMode
    );
    if (!filename) {
      return null;
    }

    const { stats } = await storageService.get(['stats']);
    const shaExists = stats?.shas?.[fullProblemDirectory]?.[README_FILENAME] !== undefined;

    // Step 1: Upload solution code
    let uploadCodeResult = null;
    if (code !== undefined && code !== null) {
      try {
        uploadCodeResult = await uploadGitWith409Retry(
          encode(code),
          problemSlug || problemName,
          filename,
          codeMsg || readmeMsg,
          {
            neverOverwrite: solutionUploadMode === MULTI_SOLUTION_MODE,
          },
          platformFolder
        );
      } catch (err) {
        console.error('[AlgoSync] Code upload failed in syncService:', err);
        throw err;
      }
    }


    // Step 2: Upload problem statement and notes
    if (!shaExists && problemStatement) {
      try {
        await uploadGitWith409Retry(
          encode(problemStatement),
          problemSlug || problemName,
          README_FILENAME,
          readmeMsg,
          undefined,
          platformFolder
        );
        console.log('[AlgoSync] Successfully uploaded problem statement README.md for:', fullProblemDirectory);
      } catch (err) {
        console.warn('[AlgoSync] Problem statement upload failed in syncService:', err);
      }
    }

    if (notes !== undefined && notes !== null && notes.length > 0) {
      try {
        await uploadGitWith409Retry(
          encode(notes),
          problemSlug || problemName,
          'NOTES.md',
          createNotesMsg,
          undefined,
          platformFolder
        );
      } catch (err) {
        console.warn('[AlgoSync] Notes upload failed in syncService:', err);
      }
    }

    // Step 3: Update repository READMEs
    try {
      await this.syncPlatformAndRootReadme(
        topicTags,
        fullProblemDirectory,
        problemTitle || problemName,
        platformFolder,
        platformName
      );
    } catch (err) {
      console.warn('[AlgoSync] README sync failed in syncService:', err);
    }

    // Step 4: Update statistics
    if (difficulty) {
      try {
        await incrementStats(difficulty, fullProblemDirectory);
      } catch (err) {
        console.warn('[AlgoSync] Stats increment failed in syncService:', err);
      }
    }

    return { filename, fullProblemDirectory, sha: uploadCodeResult };
  },
};

export default syncService;
export { syncService };
