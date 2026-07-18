import {
  LEETCODE_METADATA,
  extractTitle,
  extractSlug,
  extractDifficulty,
  extractTopics,
  extractCompanies,
  extractExamples,
  extractConstraints,
  extractDescription,
  extractLanguage,
  extractCode,
  parseStats,
  LeetCodeParser,
} from '../../scripts/parsers/leetcode/index.js';

describe('LeetCode Parser Module', () => {
  it('should export correct LEETCODE_METADATA constants', () => {
    expect(LEETCODE_METADATA.ID).toBe('leetcode');
    expect(LEETCODE_METADATA.NAME).toBe('LeetCode');
    expect(LEETCODE_METADATA.FOLDER).toBe('LeetCode');
    expect(LEETCODE_METADATA.HOSTNAMES).toContain('leetcode.com');
  });

  it('should extract title from submissionData when available', () => {
    const submissionData = { question: { title: 'Two Sum' } };
    expect(extractTitle(null, submissionData)).toBe('Two Sum');
  });

  it('should extract slug and format with leading zeros when frontendId exists', () => {
    const submissionData = {
      question: {
        titleSlug: 'two-sum',
        questionFrontendId: '1',
      },
    };
    expect(extractSlug(null, submissionData)).toBe('0001-two-sum');
  });

  it('should extract difficulty and topics from submissionData', () => {
    const submissionData = {
      question: {
        difficulty: 'Easy',
        topicTags: [{ name: 'Array', slug: 'array' }, { name: 'Hash Table', slug: 'hash-table' }],
      },
    };
    expect(extractDifficulty(null, submissionData)).toBe('Easy');
    const topics = extractTopics(null, submissionData);
    expect(topics.length).toBe(2);
    expect(topics[0].name).toBe('Array');
  });

  it('should extract companies from submissionData companyTagStatsV2', () => {
    const statsObj = {
      1: [{ name: 'Amazon' }, { name: 'Google' }],
    };
    const submissionData = {
      question: { companyTagStatsV2: JSON.stringify(statsObj) },
    };
    const companies = extractCompanies(null, submissionData);
    expect(companies.length).toBe(2);
    expect(companies[0].name).toBe('Amazon');
  });

  it('should extract examples and constraints from problem description HTML', () => {
    const html = `
      <p>Given an array of integers...</p>
      <pre>Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]</pre>
      <p><strong>Constraints:</strong></p>
      <ul>
        <li><code>2 &lt;= nums.length &lt;= 10<sup>4</sup></code></li>
        <li><code>-10<sup>9</sup> &lt;= nums[i] &lt;= 10<sup>9</sup></code></li>
      </ul>
    `;
    const submissionData = { question: { content: html } };
    expect(extractDescription(null, submissionData)).toBe(html);
    const examples = extractExamples(null, submissionData);
    expect(examples.length).toBe(1);
    expect(examples[0].content).toContain('Input: nums = [2,7,11,15]');

    const constraints = extractConstraints(null, submissionData);
    expect(constraints.length).toBe(2);
    expect(constraints[0]).toContain('2 &lt;= nums.length &lt;= 104');
  });

  it('should format stats correctly when given submissionData', () => {
    const submissionData = {
      runtimeDisplay: '52 ms',
      runtimePercentile: 85.123,
      memoryDisplay: '42.3 MB',
      memoryPercentile: 60.5,
    };
    const stats = parseStats(null, submissionData);
    expect(stats).toBe('Time: 52 ms (85.12%), Space: 42.3 MB (60.5%) - AlgoSync');
  });

  it('should expose all methods on LeetCodeParser export', () => {
    expect(typeof LeetCodeParser.extractTitle).toBe('function');
    expect(typeof LeetCodeParser.extractSlug).toBe('function');
    expect(typeof LeetCodeParser.extractDifficulty).toBe('function');
    expect(typeof LeetCodeParser.extractTopics).toBe('function');
    expect(typeof LeetCodeParser.extractCompanies).toBe('function');
    expect(typeof LeetCodeParser.extractExamples).toBe('function');
    expect(typeof LeetCodeParser.extractConstraints).toBe('function');
    expect(typeof LeetCodeParser.extractCode).toBe('function');
  });
});
