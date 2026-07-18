import { formatGfgProblemReadme } from '../scripts/platforms/gfgReadme.js';

describe('formatGfgProblemReadme', () => {
  it('formats inline GFG example labels as readable Markdown sections', () => {
    const result = formatGfgProblemReadme(
      'Largest Element In Array',
      'Medium',
      'Given an array arr[]. The task is to find the largest element and return it. Examples: Input: arr[] = [1, 8, 7, 56, 90] Output: 90 Explanation: The largest element of the given array is 90.',
      'https://www.geeksforgeeks.org/problems/largest-element-in-array/1'
    );

    expect(result).toBe(`<h2><a href="https://www.geeksforgeeks.org/problems/largest-element-in-array/1">Largest Element In Array</a></h2><h3>Medium</h3><hr><p>Given an array arr[]. The task is to find the largest element and return it.</p><p><strong>Examples:</strong></p><p><strong>Example 1:</strong></p><pre>Input: arr[] = [1, 8, 7, 56, 90]
Output: 90
Explanation: The largest element of the given array is 90.</pre>`);
  });

  it('recognizes GFG example headings when the extracted heading has no colon', () => {
    const result = formatGfgProblemReadme(
      'Next Larger Element',
      'Medium',
      'Find the next larger element. Examples Input: arr[] = [1, 3, 2, 4] Output: [3, 4, 4, -1] Explanation: The next greater element is on the right.'
    );

    expect(result).toContain('<p><strong>Example 1:</strong></p><pre>Input: arr[] = [1, 3, 2, 4]');
    expect(result).toContain('Output: [3, 4, 4, -1]');
  });
});
