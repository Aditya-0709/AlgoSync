/**
 * Repository Domain Model
 * Represents a GitHub repository attached to AlgoSync and encapsulates repo naming/README initialization.
 */
import { GITHUB_API } from '../constants/github.js';
import { getRootReadmeTemplate, isDefaultRootReadme } from '../generators/mainReadmeGenerator.js';

const { REPO_URL_BASE } = GITHUB_API;

export function normalizeGitHubRepoName(repo) {
  if (!repo || typeof repo !== 'string') {
    return repo;
  }

  let normalized = repo.trim();
  normalized = normalized.replace(/\.git$/i, '');

  const sshMatch = normalized.match(/^git@github\.com:([^/]+\/[^/]+)$/i);
  if (sshMatch) {
    return sshMatch[1].replace(/\/+$/, '');
  }

  const embeddedGitHubUrlMatch = normalized.match(/github\.com[/:]([^/\s]+)\/([^/\s?#]+)/i);
  if (embeddedGitHubUrlMatch) {
    return `${embeddedGitHubUrlMatch[1]}/${embeddedGitHubUrlMatch[2]}`.replace(/\.git$/i, '');
  }

  try {
    const parsedUrl = new URL(normalized);
    if (parsedUrl.hostname.toLowerCase() === 'github.com') {
      normalized = parsedUrl.pathname;
    }
  } catch (_err) {
    normalized = normalized.replace(/^https?:\/\/github\.com\//i, '');
    normalized = normalized.replace(/^github\.com\//i, '');
  }

  const parts = normalized
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .replace(/\.git$/i, '')
    .split('/')
    .filter(Boolean);

  return parts.slice(0, 2).join('/');
}

export function getGitHubRepoUrl(repo) {
  return `https://github.com/${normalizeGitHubRepoName(repo)}`;
}

/**
 * Uploads the professional root README.md to the repository.
 * If a default/auto-init README.md exists, it is replaced with our template.
 * If a user-modified README exists, it is preserved without changes.
 *
 * @param {string} token GitHub OAuth/Personal Access Token
 * @param {string} repoFullName e.g. "owner/repo"
 */
export async function uploadRootReadme(token, repoFullName) {
  const normalized = normalizeGitHubRepoName(repoFullName);
  const readmeContent = getRootReadmeTemplate();
  const encoded = btoa(unescape(encodeURIComponent(readmeContent)));

  // Wait briefly for GitHub to finalize its auto_init commit right after repo creation
  await new Promise(r => setTimeout(r, 2000));

  const MAX_RETRIES = 3;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      let sha = '';
      let existingContent = '';
      try {
        const checkRes = await fetch(`${REPO_URL_BASE}${normalized}/contents/README.md`, {
          headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });
        if (checkRes.ok) {
          const existing = await checkRes.json();
          sha = existing.sha;
          if (existing.content) {
            try {
              const bytes = Uint8Array.from(atob(existing.content), c => c.charCodeAt(0));
              existingContent = new TextDecoder().decode(bytes);
            } catch (_e) {
              existingContent = decodeURIComponent(escape(atob(existing.content)));
            }
          }
        }
      } catch (_e) {
        // No existing README — proceed without sha
      }

      // If existing README is already customized by user (not default/auto-init), preserve it
      if (sha && !isDefaultRootReadme(existingContent)) {
        console.log('[AlgoSync] Root README already contains custom content. Preserving user modifications.');
        return;
      }

      const response = await fetch(`${REPO_URL_BASE}${normalized}/contents/README.md`, {
        method: 'PUT',
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Initialize README - AlgoSync',
          content: encoded,
          ...(sha ? { sha } : {}),
        }),
      });

      if (response.ok) {
        console.log('[AlgoSync] Professional root README.md created successfully.');
        return;
      }

      const errData = await response.json().catch(() => ({}));
      console.warn(`[AlgoSync] README upload attempt ${attempt}/${MAX_RETRIES} failed:`, response.status, errData);

      if ((response.status === 409 || response.status === 422) && attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 1500 * attempt));
        continue;
      }

      return;
    } catch (err) {
      console.warn(`[AlgoSync] README upload attempt ${attempt}/${MAX_RETRIES} threw:`, err);
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 1500 * attempt));
      }
    }
  }
}

export class Repository {
  constructor({ hook = '', token = '', mode = 'commit', url = '' } = {}) {
    this.hook = normalizeGitHubRepoName(hook);
    this.token = token;
    this.mode = mode;
    this.url = url || (this.hook ? getGitHubRepoUrl(this.hook) : '');
  }

  async uploadRootReadme() {
    return uploadRootReadme(this.token, this.hook);
  }
}

export default Repository;
