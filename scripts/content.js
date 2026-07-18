import { LeetCodePlatform } from './platforms/leetcode.js';
import { GeeksForGeeksPlatform } from './platforms/geeksforgeeks.js';

export const platforms = [
  new LeetCodePlatform(),
  new GeeksForGeeksPlatform(),
];

/**
 * Automatically detects the current coding platform based on page URL.
 * @param {string} url
 * @returns {import('./platforms/base.js').CodingPlatform | null}
 */
export function detectPlatform(url = window.location.href) {
  return platforms.find(platform => platform.match(url)) || null;
}

const currentPlatform = detectPlatform();
if (currentPlatform) {
  const api = typeof chrome !== 'undefined' && chrome.storage ? chrome : typeof browser !== 'undefined' ? browser : null;
  if (api && api.storage && api.storage.local) {
    api.storage.local.get([`platform_${currentPlatform.id}_enabled`], (result) => {
      const enabled = result ? result[`platform_${currentPlatform.id}_enabled`] : true;
      if (enabled !== false) {
        console.log(`[AlgoSync] Active coding platform detected: ${currentPlatform.name}`);
        currentPlatform.init();
      } else {
        console.log(`[AlgoSync] Platform ${currentPlatform.name} is disabled by user in AlgoSync settings.`);
      }
    });
  } else {
    console.log(`[AlgoSync] Active coding platform detected: ${currentPlatform.name}`);
    currentPlatform.init();
  }
} else {
  console.log('[AlgoSync] No matching coding platform detected for URL:', window.location.href);
}
