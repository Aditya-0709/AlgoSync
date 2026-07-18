import {
  getPlatformProblemDirectory,
  getPlatformReadmeDirectory,
  getPath,
} from '../../scripts/generators/folderGenerator.js';

describe('Folder Generator Module', () => {
  it('should construct platform problem directory correctly', () => {
    expect(getPlatformProblemDirectory('LeetCode', '0001-two-sum')).toBe('LeetCode/0001-two-sum');
    expect(getPlatformProblemDirectory('GeeksForGeeks', null)).toBe('GeeksForGeeks');
    expect(getPlatformProblemDirectory('LeetCode', 'LeetCode/existing-slug')).toBe('LeetCode/existing-slug');
  });

  it('should construct platform readme directory correctly', () => {
    expect(getPlatformReadmeDirectory('LeetCode')).toBe('LeetCode');
    expect(getPlatformReadmeDirectory('GeeksForGeeks')).toBe('GeeksForGeeks');
  });

  it('should join directory and filename using getPath cleanly', () => {
    expect(getPath('LeetCode/0001-two-sum', 'Solution.js')).toBe('LeetCode/0001-two-sum/Solution.js');
    expect(getPath('/LeetCode/', '/README.md')).toBe('LeetCode/README.md');
    expect(getPath('', 'README.md')).toBe('README.md');
  });
});
