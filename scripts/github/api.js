/**
 * Low-level GitHub API communication utilities and string encoding helpers.
 */
import { getBrowser } from '../utils/helpers.js';
import { GITHUB_API } from '../constants/github.js';


function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Decodes a base64 encoded string into UTF-8 format. */
const decode = data => {
  try {
    const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (_e) {
    return decodeURIComponent(escape(atob(data)));
  }
};

/** Encodes a given string into base64 format. */
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

async function githubFetch(url, options) {
  const api = getBrowser();
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

/**
 * Validates a GitHub personal access token against the GitHub user endpoint.
 */
async function validateToken(token) {
  try {
    const response = await fetch(GITHUB_API.USER_URL, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

export { decode, encode, escapeRegExp, githubFetch, validateToken };
