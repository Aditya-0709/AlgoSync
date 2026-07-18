/**
 * Problem Domain Model
 * Represents a programming problem across platforms (LeetCode, GeeksForGeeks).
 */
import { convertToSlug } from '../utils/helpers.js';

export const DIFFICULTY = Object.freeze({
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
  UNKNOWN: 'Unknown',
});

/**
 * Returns the difficulty in PascalCase for a given difficulty string.
 * @param {string} difficulty - The difficulty level as a string: "easy", "medium", "hard", etc.
 * @returns {string} - The difficulty level in PascalCase: "Easy", "Medium", "Hard", or "Unknown".
 */
export function getDifficulty(difficulty) {
  let normalized = difficulty;
  if (normalized && typeof normalized === 'string') {
    normalized = normalized.toUpperCase().trim();
  }
  return DIFFICULTY[normalized] ?? DIFFICULTY.UNKNOWN;
}

/**
 * Adds leading zeros to numeric problem ID prefixes up to 4 digits.
 * @param {string} title - The slug or title, e.g. "1-two-sum".
 * @returns {string} - Formatted title, e.g. "0001-two-sum".
 */
export function addLeadingZeros(title) {
  if (!title || typeof title !== 'string') return title;
  const maxTitlePrefixLength = 4;
  const parts = title.split('-');
  const len = parts[0].length;
  if (len < maxTitlePrefixLength && !isNaN(parts[0]) && parts[0].length > 0) {
    return '0'.repeat(maxTitlePrefixLength - len) + title;
  }
  return title;
}

export class Problem {
  constructor({
    title = '',
    slug = '',
    difficulty = DIFFICULTY.UNKNOWN,
    statement = '',
    topics = [],
    directory = '',
    platformFolder = '',
    platformName = '',
    stats = null,
  } = {}) {
    this.title = title;
    this.slug = slug || (title ? addLeadingZeros(convertToSlug(title)) : '');
    this.difficulty = getDifficulty(difficulty);
    this.statement = statement;
    this.topics = topics;
    this.directory = directory;
    this.platformFolder = platformFolder;
    this.platformName = platformName;
    this.stats = stats;
  }
}

export default Problem;
