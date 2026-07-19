/**
 * Repository creation and lookup operations against GitHub API.
 */
import { GITHUB_API } from '../constants/github.js';
import { normalizeGitHubRepoName } from '../models/Repository.js';
import { getPath } from '../generators/folderGenerator.js';
import { githubFetch, validateToken } from './api.js';

async function createRepository(token, name) {
  const response = await fetch(GITHUB_API.CREATE_REPO_URL, {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      private: true,
      auto_init: true,
      description:
        'A collection of LeetCode questions to ace the coding interview! - Created using [AlgoSync](https://github.com/Aditya-0709/AlgoSync)',
    }),
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

async function linkRepository(token, repoName) {
  const normalized = normalizeGitHubRepoName(repoName);
  const response = await fetch(`${GITHUB_API.REPO_URL_BASE}${normalized}`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data, normalized };
}

async function getGitHubFile(token, hook, directory, filename) {
  const path = getPath(directory, filename);
  const repo = normalizeGitHubRepoName(hook);
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const URL = `https://api.github.com/repos/${repo}/contents/${encodedPath}`;

  const options = {
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
  const encodedDir = cleanDir
    ? cleanDir.split('/').map(encodeURIComponent).join('/')
    : '';
  const URL = `https://api.github.com/repos/${repo}/contents/${encodedDir}`;

  const options = {
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

const GitHubAPI = {
  validateToken,
  createRepo: createRepository,
  createRepository,
  linkRepo: linkRepository,
  linkRepository,
  getGitHubFile,
  getGitHubDirectoryContents,
};

export {
  createRepository,
  createRepository as createRepo,
  getGitHubDirectoryContents,
  getGitHubFile,
  GitHubAPI,
  linkRepository,
  linkRepository as linkRepo,
  validateToken,
};
