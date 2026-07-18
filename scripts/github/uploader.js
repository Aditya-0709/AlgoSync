/**
 * GitHub commit, upload, and file update operations with automatic conflict handling.
 */
import { getBrowser, LeetHubError } from '../utils/helpers.js';
import { normalizeGitHubRepoName } from '../models/Repository.js';
import { getAndInitializeStats } from '../models/Statistics.js';
import { storageService } from '../services/storageService.js';
import { getPath, getPlatformProblemDirectory } from '../generators/folderGenerator.js';
import { escapeRegExp, githubFetch } from './api.js';
import { getGitHubDirectoryContents, getGitHubFile } from './repository.js';

const OVERWRITE_SOLUTION_MODE = 'overwrite';
const MULTI_SOLUTION_MODE = 'multi';
const DEFAULT_SOLUTION_UPLOAD_MODE = OVERWRITE_SOLUTION_MODE;
const WAIT_FOR_GITHUB_API_TO_NOT_THROW_409_MS = 500;


const upload = async (
  token,
  hook,
  content,
  problemDirectory,
  filename,
  sha,
  message
) => {
  const api = getBrowser();
  const path = getPath(problemDirectory, filename);
  const repo = normalizeGitHubRepoName(hook);
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const URL = `https://api.github.com/repos/${repo}/contents/${encodedPath}`;

  const data = {
    message,
    content,
    ...(sha ? { sha } : {}),
  };

  const options = {
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
  await storageService.set({ stats });

  return body.content.sha;
};

async function getNextAvailableFilename(problemDirectory, baseFilename, extension) {
  const { leethub_token: token, leethub_hook: hook } = await storageService.get([
    'leethub_token',
    'leethub_hook',
  ]);

  const files = await getGitHubDirectoryContents(token, hook, problemDirectory);
  const pattern = new RegExp(
    `^${escapeRegExp(baseFilename)}(\\d*)${escapeRegExp(extension)}$`
  );

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
  const { leethub_token: token, leethub_hook: hook } = await storageService.get([
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

async function uploadGitWith409Retry(
  code,
  problemSlug,
  filename,
  commitMsg,
  optionals,
  platformFolder = 'LeetCode'
) {
  const storageData = await storageService.get([
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
    console.log(
      '[AlgoSync] Auto README is disabled by user in Settings. Skipping README upload.'
    );
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

        let nextFilename = await getNextAvailableFilename(
          fullProblemDirectory,
          baseNameWithoutDigits,
          extPart
        );
        if (nextFilename === filename) {
          const currentNumMatch = basePart.match(/\d+$/);
          const currentNum = currentNumMatch ? parseInt(currentNumMatch[0], 10) : 1;
          nextFilename = `${baseNameWithoutDigits}${currentNum + 1}${extPart}`;
        }

        return await uploadGitWith409Retry(
          code,
          problemSlug,
          nextFilename,
          commitMsg,
          optionals,
          platformFolder
        );
      }
      try {
        const data = await getGitHubFile(token, hook, fullProblemDirectory, filename).then(
          res => res.json()
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
        if (fileErr.message === '404' || err.message === '404') {
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
  getNextAvailableFilename,
  getNextMultiSolutionFilename,
  MULTI_SOLUTION_MODE,
  OVERWRITE_SOLUTION_MODE,
  upload,
  uploadGitWith409Retry,
  WAIT_FOR_GITHUB_API_TO_NOT_THROW_409_MS,
};
