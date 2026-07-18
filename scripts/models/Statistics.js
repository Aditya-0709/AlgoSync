/**
 * Statistics Domain Model
 * Represents user solving statistics across platforms and encapsulates stats formatting/storage updates.
 */
import { storageService } from '../services/storageService.js';
import { isEmptyObject, isObject, mergeDeep } from '../utils/helpers.js';
import { DIFFICULTY, getDifficulty } from './Problem.js';

export function formatStats(time, timePercentile, space, spacePercentile) {
  return `Time: ${time} (${timePercentile}%), Space: ${space} (${spacePercentile}%) - AlgoSync`;
}

export function mergeStats(obj1, obj2) {
  function countDifficulties(shas) {
    const difficulties = { easy: 0, medium: 0, hard: 0, solved: 0 };
    for (const problem in shas) {
      if ('difficulty' in shas[problem]) {
        const difficulty = shas[problem].difficulty;
        if (difficulty in difficulties) {
          difficulties[difficulty]++;
        }
      }
    }
    for (let value of Object.values(difficulties)) {
      difficulties.solved += value;
    }
    return difficulties;
  }

  const merged = {};
  mergeDeep(merged, obj1);
  mergeDeep(merged, obj2);

  const shas = merged.shas || {};
  const difficulties = countDifficulties(shas);

  merged.easy = difficulties.easy;
  merged.medium = difficulties.medium;
  merged.hard = difficulties.hard;
  merged.solved = difficulties.solved;

  return merged;
}

export async function getAndInitializeStats(problemKey) {
  const { stats } = await storageService.get(['stats']);
  if (stats != null && !isEmptyObject(stats)) {
    if (!stats.shas) {
      stats.shas = {};
    }
    if (problemKey && !stats.shas[problemKey]) {
      stats.shas[problemKey] = {};
    }
    return stats;
  }
  const initialStats = {
    solved: 0,
    easy: 0,
    medium: 0,
    hard: 0,
    shas: {},
  };
  if (problemKey) {
    initialStats.shas[problemKey] = {};
  }
  await storageService.set({ stats: initialStats });
  return initialStats;
}

export async function incrementStats(difficulty, problemKey) {
  const diff = getDifficulty(difficulty);
  const { stats } = await storageService.get(['stats']);
  if (!stats) return null;
  stats.solved += 1;
  stats.easy += diff === DIFFICULTY.EASY ? 1 : 0;
  stats.medium += diff === DIFFICULTY.MEDIUM ? 1 : 0;
  stats.hard += diff === DIFFICULTY.HARD ? 1 : 0;
  if (!stats.shas) {
    stats.shas = {};
  }
  if (!stats.shas[problemKey]) {
    stats.shas[problemKey] = {};
  }
  stats.shas[problemKey].difficulty = diff.toLowerCase();
  await storageService.set({ stats });
  return stats;
}

export class Statistics {
  constructor({ solved = 0, easy = 0, medium = 0, hard = 0, shas = {} } = {}) {
    this.solved = solved;
    this.easy = easy;
    this.medium = medium;
    this.hard = hard;
    this.shas = shas;
  }
}

export default Statistics;
