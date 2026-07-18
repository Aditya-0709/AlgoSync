/**
 * Question/Problem README generator module.
 * Responsible only for generating individual problem README.md markdown strings from plain problem data objects.
 */

/**
 * Formats a LeetCode problem into README markdown.
 * @param {Object} problem
 * @param {string} problem.title - Problem title (e.g. "1. Two Sum")
 * @param {string} [problem.difficulty=''] - Problem difficulty (e.g. "Easy")
 * @param {string} [problem.body=''] - Problem description HTML/markdown
 * @param {string} [problem.url=''] - Problem URL without /submissions
 * @returns {string} Markdown string
 */
export function formatLeetCodeProblemReadme({ title = '', difficulty = '', body = '', url = '' }) {
  if (url && difficulty) {
    return `<h2><a href="${url}">${title}</a></h2><h3>${difficulty}</h3><hr>${body}`;
  }
  return `<h2>${title}</h2><hr>${body}`;
}

/**
 * Formats a GeeksForGeeks problem into readable Markdown.
 * @param {string} title
 * @param {string} difficulty
 * @param {string} [statement='']
 * @param {string} [questionUrl='']
 * @returns {string} Markdown string
 */
export function formatGfgProblemReadme(title, difficulty, statement = '', questionUrl = '') {
  const text = String(statement)
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();

  const escapeHtml = value => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const examplesMatch = text.match(/\bExamples?\s*:?\s*(?=Input\s*:)/i);
  const intro = examplesMatch ? text.slice(0, examplesMatch.index).trim() : text;
  const examples = examplesMatch ? text.slice(examplesMatch.index + examplesMatch[0].length).trim() : '';
  let formattedStatement = `<p>${escapeHtml(intro)}</p>`;

  if (examples) {
    const inputParts = examples.split(/\s*(?=Input\s*:)/i).filter(Boolean);
    const renderedExamples = inputParts.map((part, index) => {
      const nextSection = part.search(/\s*(?=Constraints\s*:|Expected\s+(?:Time|Auxiliary\s+Space)\s+Complexity\s*:)/i);
      const example = (nextSection >= 0 ? part.slice(0, nextSection) : part).trim();
      const remainder = nextSection >= 0 ? part.slice(nextSection).trim() : '';
      const block = `<p><strong>Example ${index + 1}:</strong></p><pre>${escapeHtml(
        example.replace(/\s*(Input|Output|Explanation)\s*:\s*/gi, (_match, label) =>
          `${label}: `
        ).replace(/\s*(?=Output:|Explanation:)/g, '\n').trim()
      )}</pre>`;
      return remainder
        ? `${block}<p><strong>${escapeHtml(remainder)}</strong></p>`
        : block;
    });
    formattedStatement += `<p><strong>Examples:</strong></p>${renderedExamples.join('')}`;
  }

  const heading = questionUrl
    ? `<h2><a href="${questionUrl}">${title}</a></h2>`
    : `<h2>${title}</h2>`;

  return `${heading}<h3>${difficulty || 'Unknown'}</h3><hr>${formattedStatement}`;
}

/**
 * Unified problem README generator.
 * @param {Object} problem
 * @param {string} [problem.platform='leetcode'] - 'leetcode' or 'geeksforgeeks'
 * @param {string} problem.title - Problem title
 * @param {string} problem.difficulty - Difficulty
 * @param {string} [problem.body=''] - Description text/html
 * @param {string} [problem.statement=''] - Description text/html for GFG
 * @param {string} [problem.url=''] - Problem URL
 * @param {string} [problem.questionUrl=''] - Problem URL
 * @returns {string} Formatted markdown string
 */
export function generateProblemReadme(problem = {}) {
  const platform = (problem.platform || '').toLowerCase();
  if (platform === 'geeksforgeeks' || platform === 'gfg') {
    return formatGfgProblemReadme(
      problem.title || '',
      problem.difficulty || '',
      problem.statement || problem.body || '',
      problem.questionUrl || problem.url || ''
    );
  }
  return formatLeetCodeProblemReadme({
    title: problem.title || '',
    difficulty: problem.difficulty || '',
    body: problem.body || problem.statement || '',
    url: problem.url || problem.questionUrl || '',
  });
}

export const QuestionReadmeGenerator = {
  formatLeetCodeProblemReadme,
  formatGfgProblemReadme,
  generateProblemReadme,
};
export default QuestionReadmeGenerator;
