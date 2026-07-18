import {
  getSectionStart,
  getSectionEnd,
  getDefaultPlatformReadme,
  appendProblemToReadme,
  sortTopicsInReadme,
  generatePlatformReadmeContent,
} from '../../scripts/generators/platformReadmeGenerator.js';

describe('Platform README Generator Module', () => {
  it('should return default platform readme string', () => {
    expect(getDefaultPlatformReadme('LeetCode')).toBe(
      '# LeetCode Solutions\n\n<!---LeetCode Topics Start-->\n<!---LeetCode Topics End-->\n'
    );
  });

  it('should append a problem to the readme topic section and sort topics cleanly', () => {
    const initial = getDefaultPlatformReadme('LeetCode');
    const updated = appendProblemToReadme('Array', initial, 'owner/repo', 'LeetCode/0001-two-sum', '1. Two Sum', 'LeetCode');
    expect(updated).toContain('## Array');
    expect(updated).toContain('- [1. Two Sum](https://github.com/owner/repo/tree/master/LeetCode/0001-two-sum)');

    const sorted = sortTopicsInReadme(updated, 'LeetCode');
    expect(sorted).toContain('## Array\n- [1. Two Sum]');
  });

  it('should generate complete platform readme content when given options', () => {
    const result = generatePlatformReadmeContent({
      existingContent: '',
      topicTags: [{ name: 'Array' }, { name: 'Hash Table' }],
      problemDirectory: 'LeetCode/0001-two-sum',
      problemTitle: '1. Two Sum',
      platformName: 'LeetCode',
      repoHook: 'owner/repo',
    });
    expect(result).toContain('## Array');
    expect(result).toContain('## Hash Table');
    expect(result).toContain('- [1. Two Sum](https://github.com/owner/repo/tree/master/LeetCode/0001-two-sum)');
  });
});
