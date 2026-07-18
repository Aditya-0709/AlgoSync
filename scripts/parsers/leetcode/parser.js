import { checkElem, convertToSlug } from '../../utils/helpers.js';
import { addLeadingZeros, getDifficulty } from '../../models/Problem.js';
import { formatStats } from '../../models/Statistics.js';
import { languages } from '../../models/Solution.js';

/**
 * LeetCode DOM and data parser.
 * Responsible only for parsing DOM elements / GraphQL data structures to extract:
 * title, slug, difficulty, topics, companies, examples, constraints, statement, stats, code, language.
 */

export function extractTitle(doc = typeof document !== 'undefined' ? document : null, submissionData = null) {
  if (submissionData?.question?.title) {
    return submissionData.question.title.trim();
  }
  if (!doc) return 'unknown-problem';

  let qtitle = doc.querySelector('.css-v3d350');
  if (qtitle && qtitle.innerText?.trim()) {
    return qtitle.innerText.trim();
  }
  qtitle = doc.querySelector('.question-title');
  if (qtitle && qtitle.innerText?.trim()) {
    return qtitle.innerText.trim();
  }
  const titleTag = doc.querySelector('title');
  if (titleTag && titleTag.innerText) {
    const parts = titleTag.innerText.split(' ');
    if (parts.length > 2) {
      const parsed = parts.slice(0, -2).join(' ').trim();
      if (parsed) return parsed;
    }
  }
  return 'unknown-problem';
}

export function extractSlug(doc = typeof document !== 'undefined' ? document : null, submissionData = null) {
  if (submissionData?.question?.titleSlug) {
    const slugTitle = submissionData.question.titleSlug;
    const qNum = submissionData.question.questionFrontendId || submissionData.question.questionId || '';
    if (qNum) {
      return addLeadingZeros(qNum + '-' + slugTitle);
    }
    return convertToSlug(slugTitle);
  }
  if (!doc) return '0000-unknown-problem';

  const title = extractTitle(doc, submissionData);
  return addLeadingZeros(convertToSlug(title));
}

export function extractDifficulty(doc = typeof document !== 'undefined' ? document : null, submissionData = null) {
  if (submissionData?.question?.difficulty) {
    return getDifficulty(submissionData.question.difficulty);
  }
  if (!doc) return getDifficulty(null);

  const isHard = doc.querySelector('.css-t42afm');
  const isMedium = doc.querySelector('.css-dcmtd5');
  const isEasy = doc.querySelector('.css-14oi08n');

  if (isEasy) return getDifficulty('easy');
  if (isMedium) return getDifficulty('medium');
  if (isHard) return getDifficulty('hard');

  const diffElement = doc.querySelector('.mt-3.flex.space-x-4');
  if (diffElement && diffElement.children[0]?.innerText) {
    return getDifficulty(diffElement.children[0].innerText.trim());
  }

  return getDifficulty(null);
}

export function extractTopics(doc = typeof document !== 'undefined' ? document : null, submissionData = null) {
  if (submissionData?.question?.topicTags && Array.isArray(submissionData.question.topicTags)) {
    return submissionData.question.topicTags.map(tag => ({
      name: tag.name || tag.translatedName || '',
      slug: tag.slug || convertToSlug(tag.name || ''),
    })).filter(t => t.name);
  }
  if (!doc) return [];

  const topics = [];
  const tagElements = doc.querySelectorAll('a[href*="/tag/"], [class*="topic-tag"] a, [class*="topicTags"] a');
  tagElements.forEach(el => {
    const name = el.innerText?.trim();
    if (name && !topics.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      const slugAttr = el.getAttribute('href')?.split('/tag/')[1]?.replace(/\/?$/, '') || convertToSlug(name);
      topics.push({ name, slug: slugAttr });
    }
  });
  return topics;
}

export function extractCompanies(doc = typeof document !== 'undefined' ? document : null, submissionData = null) {
  const companies = [];
  if (submissionData?.question?.companyTagStatsV2) {
    try {
      const stats = typeof submissionData.question.companyTagStatsV2 === 'string'
        ? JSON.parse(submissionData.question.companyTagStatsV2)
        : submissionData.question.companyTagStatsV2;
      if (stats && typeof stats === 'object') {
        for (const key of Object.keys(stats)) {
          if (Array.isArray(stats[key])) {
            stats[key].forEach(item => {
              const name = item.name || item.slug || item.taggedBy || '';
              if (name && !companies.some(c => c.name.toLowerCase() === name.toLowerCase())) {
                companies.push({ name });
              }
            });
          }
        }
      }
    } catch (_e) {}
  }
  if (!doc) return companies;

  doc.querySelectorAll('[class*="company-tag"] a, [class*="companyTag"] a').forEach(el => {
    const name = el.innerText?.trim();
    if (name && !companies.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      companies.push({ name });
    }
  });
  return companies;
}

export function extractDescription(doc = typeof document !== 'undefined' ? document : null, submissionData = null) {
  if (submissionData?.question?.content) {
    return submissionData.question.content;
  }
  if (!doc) return null;

  const questionElem = doc.querySelector('.content__u3I1.question-content__JfgR');
  if (questionElem) {
    return questionElem.innerHTML;
  }
  const questionDescElem = doc.querySelector('.question-description__3U1T');
  if (questionDescElem) {
    return questionDescElem.innerHTML;
  }
  const descElem = doc.getElementsByName('description')[0];
  if (descElem && descElem.content) {
    return descElem.content;
  }
  return null;
}

export function extractExamples(doc = typeof document !== 'undefined' ? document : null, submissionData = null) {
  const content = extractDescription(doc, submissionData) || '';
  const examples = [];
  if (!content) return examples;

  if (typeof DOMParser !== 'undefined') {
    try {
      const parsedDoc = new DOMParser().parseFromString(content, 'text/html');
      const pres = parsedDoc.querySelectorAll('pre');
      pres.forEach((pre, index) => {
        const text = pre.innerText || pre.textContent || '';
        if (text.includes('Input:') || text.includes('Output:')) {
          examples.push({
            id: index + 1,
            content: text.trim(),
          });
        }
      });
      if (examples.length > 0) return examples;
    } catch (_e) {}
  }

  const exampleRegex = /(?:<pre>|```)([\s\S]*?)(?:<\/pre>|```)/gi;
  let match;
  let idx = 1;
  while ((match = exampleRegex.exec(content)) !== null) {
    const snippet = match[1].replace(/<[^>]+>/g, '').trim();
    if (snippet.includes('Input:') || snippet.includes('Output:')) {
      examples.push({ id: idx++, content: snippet });
    }
  }
  return examples;
}

export function extractConstraints(doc = typeof document !== 'undefined' ? document : null, submissionData = null) {
  const content = extractDescription(doc, submissionData) || '';
  const constraints = [];
  if (!content) return constraints;

  if (typeof DOMParser !== 'undefined') {
    try {
      const parsedDoc = new DOMParser().parseFromString(content, 'text/html');
      let constraintHeader = null;
      parsedDoc.querySelectorAll('strong, b, p, h3, h4').forEach(el => {
        if ((el.innerText || el.textContent || '').trim().toLowerCase().includes('constraints:')) {
          constraintHeader = el;
        }
      });
      if (constraintHeader) {
        let next = constraintHeader.nextElementSibling || constraintHeader.parentElement?.nextElementSibling;
        while (next && !['H2', 'H3', 'H4'].includes(next.tagName)) {
          if (next.tagName === 'UL' || next.tagName === 'OL') {
            next.querySelectorAll('li').forEach(li => {
              const txt = (li.innerText || li.textContent || '').trim();
              if (txt) constraints.push(txt);
            });
            break;
          } else if (next.tagName === 'LI') {
            constraints.push((next.innerText || next.textContent || '').trim());
          }
          next = next.nextElementSibling;
        }
      }
      if (constraints.length > 0) return constraints;
    } catch (_e) {}
  }

  const parts = content.split(/<strong>\s*Constraints:\s*<\/strong>/i);
  if (parts.length > 1) {
    const listMatches = parts[1].match(/<li>([\s\S]*?)<\/li>/gi);
    if (listMatches) {
      listMatches.forEach(item => {
        const clean = item.replace(/<[^>]+>/g, '').trim();
        if (clean) constraints.push(clean);
      });
    }
  }
  return constraints;
}

export function extractLanguage(doc = typeof document !== 'undefined' ? document : null, submissionData = null) {
  if (submissionData?.lang?.verboseName && languages[submissionData.lang.verboseName]) {
    return languages[submissionData.lang.verboseName];
  }
  if (!doc) return null;

  const tagList = [
    ...doc.querySelectorAll('.ant-select-selection-selected-value'),
    ...doc.querySelectorAll('.Select-value-label'),
  ];
  for (const tag of tagList) {
    const elem = tag.textContent?.trim();
    if (elem && languages[elem]) {
      return languages[elem];
    }
  }

  const buttonTag = doc.querySelector('button[id^="headlessui-listbox-button"]');
  if (buttonTag && buttonTag.innerText) {
    const lang = buttonTag.innerText.trim();
    if (languages[lang]) return languages[lang];
  }

  return null;
}

export function extractCode(doc = typeof document !== 'undefined' ? document : null, submissionData = null) {
  if (submissionData?.code) {
    return submissionData.code;
  }
  if (!doc) return null;

  const codeEl = doc.querySelector('code');
  if (codeEl && codeEl.innerText) {
    return codeEl.innerText;
  }
  return null;
}

export function parseStats(doc = typeof document !== 'undefined' ? document : null, submissionData = null) {
  if (submissionData != null) {
    const runtimePercentile = Math.round((submissionData.runtimePercentile + Number.EPSILON) * 100) / 100;
    const spacePercentile = Math.round((submissionData.memoryPercentile + Number.EPSILON) * 100) / 100;
    return formatStats(
      submissionData.runtimeDisplay,
      runtimePercentile,
      submissionData.memoryDisplay,
      spacePercentile
    );
  }
  if (!doc) return null;

  const dataHC = doc.querySelectorAll('.data__HC-i');
  if (dataHC && dataHC.length >= 4) {
    return formatStats(
      dataHC[0].textContent,
      dataHC[1].textContent,
      dataHC[2].textContent,
      dataHC[3].textContent
    );
  }

  const flexElem = doc.querySelector('.flex.w-full.pb-4');
  if (flexElem && flexElem.innerText) {
    const probStats = flexElem.innerText.split('\n');
    if (probStats.length >= 8) {
      return formatStats(probStats[1], probStats[3], probStats[5], probStats[7]);
    }
  }
  return null;
}

export const LeetCodeParser = {
  extractTitle,
  extractSlug,
  extractDifficulty,
  extractTopics,
  extractCompanies,
  extractDescription,
  extractExamples,
  extractConstraints,
  extractLanguage,
  extractCode,
  parseStats,
};
