import {
  formatLeetCodeProblemReadme,
  formatGfgProblemReadme,
  generateProblemReadme,
} from '../../scripts/generators/questionReadmeGenerator.js';

describe('Question README Generator Module', () => {
  it('should format LeetCode problem readme correctly', () => {
    const md = formatLeetCodeProblemReadme({
      title: '1. Two Sum',
      difficulty: 'Easy',
      body: '<p>Given an array...</p>',
      url: 'https://leetcode.com/problems/two-sum',
    });
    expect(md).toBe('<h2><a href="https://leetcode.com/problems/two-sum">1. Two Sum</a></h2><h3>Easy</h3><hr><p>Given an array...</p>');
  });

  it('should format GeeksForGeeks problem readme correctly', () => {
    const md = formatGfgProblemReadme(
      'Subarray with given sum',
      'Medium',
      'Given an unsorted array of non-negative integers... Examples: Input: n = 5 Output: 10',
      'https://practice.geeksforgeeks.org/problems/subarray-with-given-sum/1'
    );
    expect(md).toContain('<h2><a href="https://practice.geeksforgeeks.org/problems/subarray-with-given-sum/1">Subarray with given sum</a></h2>');
    expect(md).toContain('<h3>Medium</h3><hr>');
    expect(md).toContain('<p><strong>Examples:</strong></p>');
  });

  it('should generate problem readme dynamically based on platform', () => {
    const lc = generateProblemReadme({
      platform: 'leetcode',
      title: '1. Two Sum',
      difficulty: 'Easy',
      body: 'Description',
      url: 'https://leetcode.com/problems/two-sum',
    });
    expect(lc).toContain('1. Two Sum');

    const gfg = generateProblemReadme({
      platform: 'geeksforgeeks',
      title: 'GFG Problem',
      difficulty: 'Hard',
      statement: 'GFG Statement',
    });
    expect(gfg).toContain('GFG Problem');
  });
});
