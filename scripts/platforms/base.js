/**
 * Base Platform interface for AlgoSync coding platform integrations.
 * Each coding platform module implements this standard interface.
 */
export class CodingPlatform {
  /**
   * @param {Object} config
   * @param {string} config.id - unique identifier e.g. 'leetcode'
   * @param {string} config.name - display name e.g. 'LeetCode'
   * @param {string} config.folder - storage folder name e.g. 'LeetCode'
   * @param {string[]} config.hostnames - supported hostnames/domains
   */
  constructor({ id, name, folder, hostnames = [] }) {
    this.id = id;
    this.name = name;
    this.folder = folder;
    this.hostnames = hostnames;
  }

  /**
   * Checks whether the current page URL matches this platform.
   * @param {string} url - current window.location.href
   * @returns {boolean}
   */
  match(url) {
    if (!url) return false;
    try {
      const parsedUrl = new URL(url);
      return this.hostnames.some(
        host =>
          parsedUrl.hostname === host ||
          parsedUrl.hostname.endsWith(`.${host}`) ||
          url.includes(host)
      );
    } catch (_e) {
      return this.hostnames.some(host => url.includes(host));
    }
  }

  /**
   * Initializes content script monitoring for the platform.
   */
  init() {
    throw new Error(`Platform ${this.name} must implement init()`);
  }
}
