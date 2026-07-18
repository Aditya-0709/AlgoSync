import { decode, encode } from '../github/api.js';
import { getGitHubFile } from '../github/repository.js';
import { upload, WAIT_FOR_GITHUB_API_TO_NOT_THROW_409_MS } from '../github/uploader.js';
import { delay, getBrowser, LeetHubError } from '../utils/helpers.js';
import { normalizeGitHubRepoName } from '../models/Repository.js';
import { getRootReadmeTemplate, isDefaultRootReadme } from '../generators/mainReadmeGenerator.js';
import {
  appendProblemToReadme,
  sortTopicsInReadme,
  generatePlatformReadmeContent,
  getDefaultPlatformReadme,
} from '../generators/platformReadmeGenerator.js';
import {
  generateRootReadmeSummary,
  generateRootReadmeContent,
} from '../generators/mainReadmeGenerator.js';
import { storageService } from '../services/storageService.js';
import { getPlatformReadmeDirectory } from '../generators/folderGenerator.js';

async function uploadReadmeFileWithRetry(token, hook, content, directory, filename, commitMsg, sha = '') {
  try {
    return await upload(token, hook, content, directory, filename, sha, commitMsg);
  } catch (err) {
    if (err.message === '409' || err.message === '422' || err.message === '404') {
      try {
        const data = await getGitHubFile(token, hook, directory, filename).then(res => res.json());
        return await upload(token, hook, content, directory, filename, data.sha, commitMsg);
      } catch (fileErr) {
        if ((fileErr.message === '404' || err.message === '404') && sha) {
          return await upload(token, hook, content, directory, filename, '', commitMsg);
        }
        if (fileErr.message === '404' && !sha) {
          await delay(() => Promise.resolve(), WAIT_FOR_GITHUB_API_TO_NOT_THROW_409_MS);
          return await upload(token, hook, content, directory, filename, '', commitMsg);
        }
        throw fileErr;
      }
    }
    throw err;
  }
}


async function updatePlatformReadme(topicTags, problemDirectory, problemTitle, platformFolder, platformName) {
  const { leethub_token, leethub_hook, stats } = await storageService.get([
    'leethub_token',
    'leethub_hook',
    'stats',
  ]);
  const repo = normalizeGitHubRepoName(leethub_hook);
  const platformReadmeDir = getPlatformReadmeDirectory(platformFolder);
  const platformReadmeFile = 'README.md';

  let readme;
  let sha = '';

  try {
    const res = await getGitHubFile(
      leethub_token,
      repo,
      platformReadmeDir,
      platformReadmeFile
    ).then(resp => resp.json());
    readme = res.content;
    sha = res.sha;
    if (!stats.shas[platformReadmeDir]) stats.shas[platformReadmeDir] = {};
    stats.shas[platformReadmeDir][platformReadmeFile] = sha;
    await storageService.set({ stats });
  } catch (err) {
    if (err.message === '404') {
      const defaultReadme = getDefaultPlatformReadme(platformName);
      sha = await uploadReadmeFileWithRetry(
        leethub_token,
        repo,
        encode(defaultReadme),
        platformReadmeDir,
        platformReadmeFile,
        `Create ${platformName} README - AlgoSync`
      );
      readme = encode(defaultReadme);
      if (!stats.shas[platformReadmeDir]) stats.shas[platformReadmeDir] = {};
      stats.shas[platformReadmeDir][platformReadmeFile] = sha;
      await storageService.set({ stats });
    } else {
      throw err;
    }
  }

  readme = decode(readme);
  readme = generatePlatformReadmeContent({
    existingContent: readme,
    topicTags,
    problemDirectory,
    problemTitle,
    platformName,
    repoHook: repo,
  });
  const encodedReadme = encode(readme);

  return delay(
    () => uploadReadmeFileWithRetry(leethub_token, repo, encodedReadme, platformReadmeDir, platformReadmeFile, `Update ${platformName} README - Topic Tags`, sha),
    WAIT_FOR_GITHUB_API_TO_NOT_THROW_409_MS
  );
}

async function updateRootReadme(leethub_token, repo, stats) {
  const platformCounts = {};
  let totalSolved = 0;
  const shas = stats?.shas || {};

  for (const directoryKey of Object.keys(shas)) {
    if (!directoryKey || directoryKey === 'README.md' || directoryKey === 'stats.json' || directoryKey.endsWith('/README.md') || directoryKey.endsWith('/NOTES.md')) {
      continue;
    }
    if (directoryKey === 'DSA' || directoryKey === 'DSA/LeetCode' || directoryKey === 'DSA/GeeksForGeeks' || directoryKey === 'LeetCode' || directoryKey === 'GeeksForGeeks') {
      continue;
    }
    if (directoryKey.startsWith('LeetCode/') || directoryKey.startsWith('GeeksForGeeks/')) {
      const parts = directoryKey.split('/');
      if (parts.length >= 2) {
        const platform = parts[0];
        platformCounts[platform] = (platformCounts[platform] || 0) + 1;
        totalSolved++;
      }
    } else if (directoryKey.startsWith('DSA/')) {
      const parts = directoryKey.split('/');
      if (parts.length >= 3) {
        const platform = parts[1];
        platformCounts[platform] = (platformCounts[platform] || 0) + 1;
        totalSolved++;
      }
    } else if (directoryKey.includes('-') && shas[directoryKey] && typeof shas[directoryKey] === 'object') {
      platformCounts['LeetCode'] = (platformCounts['LeetCode'] || 0) + 1;
      totalSolved++;
    }
  }

  const directoriesToUpdate = [''];
  for (const directory of directoriesToUpdate) {
    let rootReadme;
    let sha = '';
    try {
      const res = await getGitHubFile(leethub_token, repo, directory, 'README.md').then(resp => resp.json());
      rootReadme = decode(res.content);
      sha = res.sha;
    } catch (err) {
      if (err.message === '404') {
        rootReadme = '';
      } else {
        throw err;
      }
    }

    rootReadme = generateRootReadmeContent({
      existingContent: rootReadme,
      directory,
      platformCounts,
      totalSolved,
    });

    const encodedRootReadme = encode(rootReadme);
    const newSha = await uploadReadmeFileWithRetry(leethub_token, repo, encodedRootReadme, directory, 'README.md', 'Update Root README - AlgoSync', sha);
    const storageKey = directory ? `${directory}/README.md` : 'README.md';
    if (!stats.shas[storageKey]) stats.shas[storageKey] = {};
    stats.shas[storageKey][''] = newSha;
    await delay(() => Promise.resolve(), WAIT_FOR_GITHUB_API_TO_NOT_THROW_409_MS);
  }

  await storageService.set({ stats });
}

async function updatePlatformAndRootReadme(topicTags, problemDirectory, problemSlug, problemTitle, platformFolder, platformName) {
  try {
    await updatePlatformReadme(topicTags, problemDirectory, problemTitle, platformFolder, platformName);
    console.log(`[AlgoSync] ${platformName} Platform README update succeeded`);
  } catch (err) {
    console.error(`[AlgoSync] Platform README update failed:`, err);
  }

  await delay(() => Promise.resolve(), WAIT_FOR_GITHUB_API_TO_NOT_THROW_409_MS);

  try {
    const { leethub_token, leethub_hook, stats } = await storageService.get([
      'leethub_token',
      'leethub_hook',
      'stats',
    ]);
    const repo = normalizeGitHubRepoName(leethub_hook);
    await updateRootReadme(leethub_token, repo, stats);
    console.log(`[AlgoSync] Root README update succeeded`);
  } catch (err) {
    console.error(`[AlgoSync] Root README update failed:`, err);
  }
}

export {
  appendProblemToReadme,
  sortTopicsInReadme,
  updatePlatformReadme,
  updateRootReadme,
  updatePlatformAndRootReadme,
  generateRootReadmeSummary,
};
