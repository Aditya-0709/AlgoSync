import {
  getRootReadmeTemplate,
  isDefaultRootReadme,
  generateRootReadmeSummary,
  generateRootReadmeContent,
} from '../../scripts/generators/mainReadmeGenerator.js';

describe('Main README Generator Module', () => {
  it('should generate static root readme template', () => {
    const template = getRootReadmeTemplate();
    expect(template).toContain('# 📚 DSA');
    expect(template).toContain('My collection of Data Structures & Algorithms solutions');
  });

  it('should identify default root readme correctly', () => {
    expect(isDefaultRootReadme('')).toBe(true);
    expect(isDefaultRootReadme(getRootReadmeTemplate())).toBe(true);
    expect(isDefaultRootReadme('# DSA Repository\n\nSome custom note')).toBe(false);
  });

  it('should generate root readme summary table/list', () => {
    const summary = generateRootReadmeSummary({ LeetCode: 15, GeeksForGeeks: 10 }, 25);
    expect(summary).toContain('- GeeksForGeeks : 10 Problems');
    expect(summary).toContain('- LeetCode : 15 Problems');
    expect(summary).toContain('Total Solved : 25');
  });

  it('should generate full root readme content with platform summary block inserted', () => {
    const content = generateRootReadmeContent({
      existingContent: '',
      directory: '',
      platformCounts: { LeetCode: 5 },
      totalSolved: 5,
    });
    expect(content).toContain('# 📚 DSA');
    expect(content).toContain('<!---Platforms Start-->');
    expect(content).toContain('- LeetCode : 5 Problems');
    expect(content).toContain('<!---Platforms End-->');
  });
});
