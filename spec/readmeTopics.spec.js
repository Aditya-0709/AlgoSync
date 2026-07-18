import {
  appendProblemToReadme,
  sortTopicsInReadme,
  generateRootReadmeSummary,
} from '../scripts/leetcode/readmeTopics.js';

describe('appendProblemToReadme', () => {
  it('should correctly append using clean bullet format to previous readme which has start and end tags', () => {
    const sampleText = `# LeetCode Solutions
### Extra Hard questions
These are notes I want for extra hard problems

# About me
This a repo I had that I wished to do xyz with

<!---LeetCode Topics Start-->
# LeetCode Topics

## Hash Table
- [0020-fake-problem](https://github.com/any/tree/master/0020-fake-problem)

<!---LeetCode Topics End-->`;

    const output = appendProblemToReadme(
      'Hash Table',
      sampleText,
      'any',
      '0013-roman-to-integer',
      'Roman to Integer',
      'LeetCode'
    );
    const expected = `# LeetCode Solutions
### Extra Hard questions
These are notes I want for extra hard problems

# About me
This a repo I had that I wished to do xyz with

<!---LeetCode Topics Start-->
# LeetCode Topics

## Hash Table
- [0020-fake-problem](https://github.com/any/tree/master/0020-fake-problem)
- [Roman to Integer](https://github.com/any/tree/master/0013-roman-to-integer)

<!---LeetCode Topics End-->`;
    expect(output).toBe(expected);
  });

  it('should not append duplicate problem by slug or title', () => {
    const sampleText = `# LeetCode Solutions

<!---Topics Start-->
## Hash Table
- [Roman to Integer](https://github.com/any/tree/master/0013-roman-to-integer)
<!---Topics End-->`;

    const outputSlugCheck = appendProblemToReadme(
      'Hash Table',
      sampleText,
      'any',
      '0013-roman-to-integer',
      'Roman to Integer',
      'LeetCode'
    );
    expect(outputSlugCheck).toBe(sampleText);

    const outputTitleCheck = appendProblemToReadme(
      'Hash Table',
      sampleText,
      'any',
      '0013-roman-to-integer-alt',
      'Roman to Integer',
      'LeetCode'
    );
    expect(outputTitleCheck).toBe(sampleText);
  });

  it('should append new category at the end of topics section preserving existing stable category order', () => {
    const sampleText = `# GeeksForGeeks Solutions

<!---GeeksForGeeks Topics Start-->
## Strings
- [Reverse Words](https://github.com/any/tree/master/reverse-words)
<!---GeeksForGeeks Topics End-->`;

    const output = appendProblemToReadme(
      'Arrays',
      sampleText,
      'any',
      'missing-number',
      'Missing Number',
      'GeeksForGeeks'
    );

    const expected = `# GeeksForGeeks Solutions

<!---GeeksForGeeks Topics Start-->
## Strings
- [Reverse Words](https://github.com/any/tree/master/reverse-words)

## Arrays
- [Missing Number](https://github.com/any/tree/master/missing-number)

<!---GeeksForGeeks Topics End-->`;
    expect(output).toBe(expected);
  });
});

describe('sortTopicsInReadme', () => {
  it('should sort problems alphabetically inside each category without reordering categories', () => {
    const sampleText = `# LeetCode Solutions

<!---Topics Start-->
## Strings
- [Reverse Words in a String](https://github.com/any/tree/master/0151-reverse-words)
- [Longest Common Prefix](https://github.com/any/tree/master/0014-longest-common-prefix)

## Arrays
- [Two Sum](https://github.com/any/tree/master/0001-two-sum)
- [Product of Array Except Self](https://github.com/any/tree/master/0238-product)
- [Best Time to Buy and Sell Stock](https://github.com/any/tree/master/0121-stock)
<!---Topics End-->`;

    const output = sortTopicsInReadme(sampleText, 'LeetCode');
    const expected = `# LeetCode Solutions

<!---Topics Start-->
## Strings
- [Longest Common Prefix](https://github.com/any/tree/master/0014-longest-common-prefix)
- [Reverse Words in a String](https://github.com/any/tree/master/0151-reverse-words)

## Arrays
- [Best Time to Buy and Sell Stock](https://github.com/any/tree/master/0121-stock)
- [Product of Array Except Self](https://github.com/any/tree/master/0238-product)
- [Two Sum](https://github.com/any/tree/master/0001-two-sum)

<!---Topics End-->`;
    expect(output).toBe(expected);
  });

  it('should convert legacy table rows to clean bullets and remove duplicates while sorting', () => {
    const sampleText = `# LeetCode Topics

<!---LeetCode Topics Start-->
## Hash Table
|  |
| ------- |
| [Two Sum](https://github.com/any/tree/master/0001-two-sum) |
| [Roman to Integer](https://github.com/any/tree/master/0013-roman-to-integer) |
- [Roman to Integer](https://github.com/any/tree/master/0013-roman-to-integer)
| [Anagrams](https://github.com/any/tree/master/0049-anagrams) |
<!---LeetCode Topics End-->`;

    const output = sortTopicsInReadme(sampleText, 'LeetCode');
    const expected = `# LeetCode Topics

<!---LeetCode Topics Start-->
## Hash Table
- [Anagrams](https://github.com/any/tree/master/0049-anagrams)
- [Roman to Integer](https://github.com/any/tree/master/0013-roman-to-integer)
- [Two Sum](https://github.com/any/tree/master/0001-two-sum)

<!---LeetCode Topics End-->`;
    expect(output).toBe(expected);
  });
});

describe('generateRootReadmeSummary', () => {
  it('should correctly format platforms summary block matching the required root README example', () => {
    const platformCounts = {
      LeetCode: 150,
      GeeksForGeeks: 95,
      Code360: 20,
      HackerRank: 10,
    };
    const output = generateRootReadmeSummary(platformCounts, 275);
    const expected = `## Platforms

- Code360 : 20 Problems
- GeeksForGeeks : 95 Problems
- HackerRank : 10 Problems
- LeetCode : 150 Problems

Total Solved : 275`;
    expect(output).toBe(expected);
  });
});
