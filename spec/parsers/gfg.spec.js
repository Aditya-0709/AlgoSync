import {
  GFG_METADATA,
  findProblemContainer,
  removeAuthorMetadata,
  extractGfgProblemStatement,
  findTitle,
  findDifficulty,
  findTopicTags,
  findGfgLanguage,
  _getCodeFromDOM,
  extractSlug,
  extractCompanies,
  extractExamples,
  extractConstraints,
  GfgParser,
} from '../../scripts/parsers/gfg/index.js';

describe('GeeksForGeeks Parser Module', () => {
  it('should export correct GFG_METADATA constants', () => {
    expect(GFG_METADATA.ID).toBe('geeksforgeeks');
    expect(GFG_METADATA.NAME).toBe('GeeksForGeeks');
    expect(GFG_METADATA.FOLDER).toBe('GeeksForGeeks');
    expect(GFG_METADATA.HOSTNAMES).toContain('practice.geeksforgeeks.org');
  });

  it('should extract title and slug cleanly from location URL when available', () => {
    const location = { pathname: '/problems/subarray-with-given-sum-1587115621/1' };
    const title = findTitle(null, location);
    expect(title).toBe('Subarray With Given Sum');
    const slug = extractSlug(null, location);
    expect(slug).toBe('subarray-with-given-sum-gfg');
  });

  it('should return default Medium difficulty when doc is null', () => {
    expect(findDifficulty(null)).toBe('Medium');
  });

  it('should return General topic tag when doc is null', async () => {
    const tags = await findTopicTags(null);
    expect(tags).toEqual([{ name: 'General' }]);
  });

  it('should return default Python language extension when doc is null', () => {
    expect(findGfgLanguage(null)).toBe('.py');
  });

  it('should extract examples and constraints from problem statement text', () => {
    const fakeDoc = {
      body: { innerText: 'Problem text' },
      querySelectorAll: () => [],
      querySelector: () => ({ content: 'Example 1: Input: n = 5 Output: 10 Constraints: 1 <= N <= 10^5' }),
      createElement: () => ({ innerHTML: '', innerText: 'Example 1: Input: n = 5 Output: 10 Constraints: 1 <= N <= 10^5' }),
    };
    const examples = extractExamples(fakeDoc);
    expect(examples.length).toBe(1);
    expect(examples[0].content).toContain('Input: n = 5 Output: 10');

    const constraints = extractConstraints(fakeDoc);
    expect(constraints.length).toBe(1);
    expect(constraints[0]).toContain('1 <= N <= 10^5');
  });

  it('should expose all methods on GfgParser export', () => {
    expect(typeof GfgParser.findProblemContainer).toBe('function');
    expect(typeof GfgParser.removeAuthorMetadata).toBe('function');
    expect(typeof GfgParser.extractGfgProblemStatement).toBe('function');
    expect(typeof GfgParser.findTitle).toBe('function');
    expect(typeof GfgParser.findDifficulty).toBe('function');
    expect(typeof GfgParser.findTopicTags).toBe('function');
    expect(typeof GfgParser.findGfgLanguage).toBe('function');
    expect(typeof GfgParser._getCodeFromDOM).toBe('function');
    expect(typeof GfgParser.extractSlug).toBe('function');
    expect(typeof GfgParser.extractCompanies).toBe('function');
    expect(typeof GfgParser.extractExamples).toBe('function');
    expect(typeof GfgParser.extractConstraints).toBe('function');
  });
});
