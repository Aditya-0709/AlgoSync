import { Problem, DIFFICULTY, getDifficulty, addLeadingZeros } from '../../scripts/models/Problem.js';
import { Solution, OVERWRITE_SOLUTION_MODE, MULTI_SOLUTION_MODE, SOLUTION_TYPES, languages } from '../../scripts/models/Solution.js';
import { Repository, normalizeGitHubRepoName, getGitHubRepoUrl } from '../../scripts/models/Repository.js';
import { Statistics, formatStats, mergeStats } from '../../scripts/models/Statistics.js';

describe('Domain Models Layer', () => {
  describe('Problem Model', () => {
    it('should construct a Problem with proper default values and formatted fields', () => {
      const p = new Problem({
        title: '1-two-sum',
        difficulty: 'easy',
        statement: '<p>Two sum description</p>',
        topics: ['Array', 'Hash Table'],
        directory: 'LeetCode/0001-two-sum',
        platformFolder: 'LeetCode',
        platformName: 'LeetCode',
      });

      expect(p.title).toBe('1-two-sum');
      expect(p.slug).toBe('0001-two-sum');
      expect(p.difficulty).toBe(DIFFICULTY.EASY);
      expect(p.statement).toBe('<p>Two sum description</p>');
      expect(p.topics).toEqual(['Array', 'Hash Table']);
    });

    it('should correctly format difficulty and leading zeros', () => {
      expect(getDifficulty('medium')).toBe(DIFFICULTY.MEDIUM);
      expect(getDifficulty('HARD')).toBe(DIFFICULTY.HARD);
      expect(getDifficulty('unknown_string')).toBe(DIFFICULTY.UNKNOWN);
      expect(addLeadingZeros('1-two-sum')).toBe('0001-two-sum');
    });
  });

  describe('Solution Model', () => {
    it('should construct a Solution and resolve language extension correctly', () => {
      const sol = new Solution({
        problemSlug: '0001-two-sum',
        code: 'function twoSum() {}',
        language: 'JavaScript',
        filename: 'Solution.js',
        uploadMode: OVERWRITE_SOLUTION_MODE,
      });

      expect(sol.problemSlug).toBe('0001-two-sum');
      expect(sol.extension).toBe('.js');
      expect(sol.uploadMode).toBe(OVERWRITE_SOLUTION_MODE);
      expect(languages['Python3']).toBe('.py');
    });
  });

  describe('Repository Model', () => {
    it('should construct a Repository and normalize hook and url', () => {
      const repo = new Repository({
        hook: 'https://github.com/testuser/DSA-Repo.git',
        token: 'secret_token',
      });

      expect(repo.hook).toBe('testuser/DSA-Repo');
      expect(repo.url).toBe('https://github.com/testuser/DSA-Repo');
      expect(normalizeGitHubRepoName('git@github.com:owner/project.git')).toBe('owner/project');
      expect(getGitHubRepoUrl('owner/project')).toBe('https://github.com/owner/project');
    });
  });

  describe('Statistics Model', () => {
    it('should construct Statistics and format/merge correctly', () => {
      const stats = new Statistics({ solved: 10, easy: 5, medium: 3, hard: 2 });
      expect(stats.solved).toBe(10);
      expect(formatStats('5ms', '80.5', '42MB', '90.1')).toBe(
        'Time: 5ms (80.5%), Space: 42MB (90.1%) - AlgoSync'
      );

      const obj1 = { shas: { 'LeetCode/0001-two-sum': { difficulty: 'easy' } } };
      const obj2 = { shas: { 'LeetCode/0002-add-two-numbers': { difficulty: 'medium' } } };
      const merged = mergeStats(obj1, obj2);
      expect(merged.solved).toBe(2);
      expect(merged.easy).toBe(1);
      expect(merged.medium).toBe(1);
    });
  });
});
