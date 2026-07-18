/**
 * Platform Service
 * Responsible for detecting the current platform, returning the appropriate parser, and returning platform metadata.
 */
import { detectPlatform as detectPlatformFromIndex, platforms } from '../platforms/index.js';
import { LeetCodeParser, LEETCODE_METADATA } from '../parsers/leetcode/index.js';
import { GfgParser, GFG_METADATA } from '../parsers/gfg/index.js';

const platformService = {
  detectPlatform(url = typeof window !== 'undefined' && window.location ? window.location.href : '') {
    return detectPlatformFromIndex(url);
  },

  getParser(platformOrId) {
    const id = typeof platformOrId === 'string' ? platformOrId : platformOrId?.id;
    if (id === 'leetcode' || id === LEETCODE_METADATA.ID) {
      return LeetCodeParser;
    }
    if (id === 'geeksforgeeks' || id === GFG_METADATA.ID) {
      return GfgParser;
    }
    return null;
  },

  getMetadata(platformOrId) {
    const id = typeof platformOrId === 'string' ? platformOrId : platformOrId?.id;
    if (id === 'leetcode' || id === LEETCODE_METADATA.ID) {
      return LEETCODE_METADATA;
    }
    if (id === 'geeksforgeeks' || id === GFG_METADATA.ID) {
      return GFG_METADATA;
    }
    return null;
  },
};

export default platformService;
export { platformService };
