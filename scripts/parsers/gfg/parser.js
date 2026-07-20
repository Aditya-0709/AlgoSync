import { convertToSlug } from '../../utils/helpers.js';
import { languages } from '../../models/Solution.js';

const DESCRIPTION_SELECTORS = [
  '[class*="problems_problem_content"]', '[class*="problem_content"]',
  '[class*="problemContent"]', '[class*="problem-content"]',
  '[class*="problems_description"]', '[class*="problem_description"]',
  '[class*="problemDescription"]', '[class*="problems_question"]',
  '[class*="problem_question"]', '[class*="problemQuestion"]',
  '[class*="problem_para"]', '[class*="description_body"]',
  '[class*="question_body"]', '.problems_problem_content', '.problem-statement',
  '.problem_statement', '#problemDescription', '#problem_description',
  '#problem-statement', '[class*="gfg-problem-description"]',
  '[class*="problem-description"]',
];

const AUTHOR_SELECTORS = [
  '[class*="author"]', '[class*="contributor"]', '[class*="user-info"]',
  '[class*="userInfo"]', '[class*="user_info"]', '[class*="profile"]',
  '[class*="createdBy"]', '[class*="created_by"]', '[class*="author_info"]',
  '[class*="authorInfo"]', '[class*="problem_author"]', '[class*="problemAuthor"]',
  '[class*="submitted_by"]', '[class*="submittedBy"]', '[class*="posted_by"]',
  '[class*="postedBy"]', '[class*="avatar"]', '[class*="ago"]',
  '[class*="timestamp"]', '[class*="meta_info"]', '[class*="metaInfo"]',
];

function isCandidate(element, pageTextLength, minLength = 30) {
  const text = (element?.innerText || element?.textContent || '').trim();
  const className = element?.className?.toString() || '';
  return text.length > minLength && text.length < pageTextLength * 0.8 &&
    !className.includes('root') && !className.includes('containerWrapper');
}

export function findProblemContainer(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc) return null;
  const pageTextLength = (doc.body?.innerText || doc.body?.textContent || '').length || 999999;
  let bestElement = null;
  let maxLength = 0;

  for (const selector of DESCRIPTION_SELECTORS) {
    doc.querySelectorAll(selector).forEach(element => {
      const length = (element.innerText || element.textContent || '').trim().length;
      if (length > maxLength && isCandidate(element, pageTextLength)) {
        bestElement = element;
        maxLength = length;
      }
    });
  }

  if (maxLength >= 50) return bestElement;

  doc.querySelectorAll('div, section, article').forEach(element => {
    const text = element.innerText || element.textContent || '';
    if (
      (text.includes('Example') || text.includes('Input:')) && text.includes('Output:') &&
      text.length > maxLength && text.length < pageTextLength * 0.7 &&
      isCandidate(element, pageTextLength)
    ) {
      bestElement = element;
      maxLength = text.length;
    }
  });
  return bestElement;
}

export function removeAuthorMetadata(wrapper) {
  AUTHOR_SELECTORS.forEach(selector => wrapper.querySelectorAll(selector).forEach(node => node.remove()));

  const datePattern = /\d+\s*(days?|hours?|minutes?|mins?|seconds?|secs?|weeks?|months?|years?)\s*ago/i;
  const gmtPattern = /\(GMT\s*[+\-]?\d+:\d+\)/i;
  const visit = node => {
    Array.from(node.childNodes).forEach(child => {
      if (child.nodeType !== 1) return;
      const text = (child.innerText || child.textContent || '').trim();
      if ((datePattern.test(text) || gmtPattern.test(text)) && text.length < 200) child.remove();
      else visit(child);
    });
  };
  visit(wrapper);
}

/** Extracts clean problem text from the current GeeksForGeeks document. */
export function extractGfgProblemStatement(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc) return '';
  try {
    const container = findProblemContainer(doc);
    if (!container) {
      const metaDesc = doc.querySelector('meta[name="description"]')?.content || '';
      return metaDesc ? metaDesc.trim() : '';
    }

    const wrapper = doc.createElement('div');
    wrapper.innerHTML = container.outerHTML;
    removeAuthorMetadata(wrapper);
    const text = (wrapper.innerText || wrapper.textContent || '').trim();
    if (text) return text;
    return (container.innerText || container.textContent || '').trim();
  } catch (_error) {
    return '';
  }
}

export function findTitle(doc = typeof document !== 'undefined' ? document : null, location = typeof window !== 'undefined' ? window.location : null) {
  const successPhrases = [
    'problem solved', 'solved successfully', 'correct answer',
    'all test cases', 'compilation error', 'runtime error',
    'time limit exceeded', 'wrong answer', 'accepted',
  ];
  const isSuccessText = (text) => {
    const lower = text.toLowerCase();
    return successPhrases.some(p => lower.includes(p));
  };

  try {
    if (location && location.pathname) {
      const urlMatch = location.pathname.match(/\/problems\/([^/]+)/);
      if (urlMatch && urlMatch[1]) {
        const slug = urlMatch[1]
          .replace(/\d+$/, '')
          .replace(/-+$/, '')
          .replace(/-/g, ' ')
          .trim();
        if (slug.length > 0) {
          const titleCased = slug.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          return titleCased;
        }
      }
    }
  } catch (_e) {}

  if (!doc) return 'Unknown Problem';

  try {

    let ele = doc.querySelector('[class^="problems_header_content__title"] > h3');
    if (ele && ele.innerText?.trim() && !isSuccessText(ele.innerText.trim())) {
      return ele.innerText.trim();
    }

    const headings = doc.querySelectorAll('h1, h2, h3, [class*="problem-title"], [class*="problems_title"]');
    for (let h of headings) {
      const text = h.innerText?.trim();
      if (
        text &&
        text.length < 100 &&
        !text.toLowerCase().includes('geeksforgeeks') &&
        !text.toLowerCase().includes('topic tags') &&
        !isSuccessText(text)
      ) {
        return text;
      }
    }

    if (doc.title) {
      const parts = doc.title.split('|');
      const titlePart = parts[0]?.trim();
      if (titlePart && !isSuccessText(titlePart)) return titlePart;
    }
  } catch (_e) {}
  return 'Unknown Problem';
}

export function findDifficulty(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc) return 'Medium';
  try {
    const ele = doc.querySelectorAll('[class^="problems_header_description"]')[0]?.children[0]?.innerText;
    if (ele != null) {
      const val = ele.trim();
      if (val === 'Basic' || val === 'School') return 'Easy';
      if (['Easy', 'Medium', 'Hard'].includes(val)) return val;
    }
    const badges = doc.querySelectorAll('[class*="badge"], [class*="difficulty"], span, div');
    for (let b of badges) {
      const text = b.innerText?.trim();
      if (text === 'Basic' || text === 'School' || text === 'Easy') return 'Easy';
      if (text === 'Medium') return 'Medium';
      if (text === 'Hard') return 'Hard';
    }
  } catch (_e) {}
  return 'Medium';
}

export async function findTopicTags(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc) return [{ name: 'General' }];
  try {
    const tags = [];
    const addTag = (text, el = null, isExplicitTopicContainer = false) => {
      if (!text) return;
      const cleaned = typeof text === 'string' ? text.trim() : String(text).trim();
      if (
        cleaned &&
        cleaned.length > 1 &&
        cleaned.length < 35 &&
        !cleaned.includes('\n') &&
        !cleaned.includes('\r') &&
        !['topic tags', 'topic tag', 'company tags', 'company tag', 'tags', 'topics', 'show more', 'hide', 'general', 'practice', 'related articles', 'similar problems', 'companies', 'easy', 'medium', 'hard', 'basic', 'school'].includes(cleaned.toLowerCase()) &&
        !tags.some(t => t.name.toLowerCase() === cleaned.toLowerCase())
      ) {
        if (!isExplicitTopicContainer && el && doc.body) {
          let cur = el;
          let hops = 0;
          let isInsideTopicContainer = false;
          while (cur && cur !== doc.body && hops < 8) {
            const cls = cur.className?.toString().toLowerCase() || '';
            const id = cur.id?.toString().toLowerCase() || '';
            if (cls.includes('topic') || id.includes('topic')) {
              isInsideTopicContainer = true;
            }
            if (!isInsideTopicContainer && (cls.includes('company') || id.includes('company') || cls.includes('article') || cls.includes('related') || cls.includes('similar'))) {
              return;
            }
            const prevTxt = cur.previousElementSibling?.innerText?.trim()?.toLowerCase() || '';
            if (!isInsideTopicContainer && (prevTxt.includes('company') || prevTxt.includes('related article') || prevTxt.includes('similar problem'))) {
              return;
            }
            cur = cur.parentElement;
            hops++;
          }
        }
        tags.push({ name: cleaned });
      }
    };

    // 1. Try __NEXT_DATA__ extraction with expanded keys and object support
    try {
      const nextDataEl = doc.getElementById('__NEXT_DATA__');
      if (nextDataEl) {
        const nextText = nextDataEl.textContent || nextDataEl.innerText || '';
        if (nextText) {
          const nextData = JSON.parse(nextText);
          const pageProps = nextData?.props?.pageProps;
          let topicTags = pageProps?.initialState?.problemData?.allData?.probData?.tags?.topic_tags;

          if (!topicTags || topicTags.length === 0) {
            const queries = pageProps?.initialState?.problemApi?.queries;
            if (queries && typeof queries === 'object') {
              for (const [, queryVal] of Object.entries(queries)) {
                const qt = queryVal?.data?.tags?.topic_tags || queryVal?.data?.topic_tags || queryVal?.data?.topics;
                if (qt && Array.isArray(qt) && qt.length > 0) {
                  topicTags = qt;
                  break;
                }
              }
            }
          }

          if (!topicTags || topicTags.length === 0) {
            const deepSearch = (obj, depth = 0) => {
              if (depth > 8 || !obj || topicTags) return;
              if (Array.isArray(obj)) {
                for (const item of obj) deepSearch(item, depth + 1);
              } else if (typeof obj === 'object') {
                for (const [k, v] of Object.entries(obj)) {
                  const lk = k.toLowerCase();
                  if (['topic_tags', 'topictags', 'topic_tag', 'topics', 'problemtags', 'problem_tags'].includes(lk) && Array.isArray(v) && v.length > 0) {
                    const validItems = v.filter(item => {
                      if (typeof item === 'string') return item && !item.toLowerCase().includes('company');
                      if (item && typeof item === 'object') {
                        const t = item.name || item.tag || item.text || item.label || item.title || item.slug || '';
                        return t && typeof t === 'string' && !t.toLowerCase().includes('company');
                      }
                      return false;
                    });
                    if (validItems.length > 0) {
                      topicTags = validItems;
                      return;
                    }
                  }
                  if (!['companytags', 'company_tags', 'companies', 'relatedarticles', 'similarproblems', 'articles'].includes(lk)) {
                    deepSearch(v, depth + 1);
                  }
                }
              }
            };
            deepSearch(pageProps);
          }

          if (topicTags && Array.isArray(topicTags) && topicTags.length > 0) {
            for (const tag of topicTags) {
              if (typeof tag === 'string') addTag(tag, null, true);
              else if (tag && typeof tag === 'object') {
                const name = tag.name || tag.tag || tag.text || tag.label || tag.title || tag.slug || tag.value;
                if (name) addTag(name, null, true);
              }
            }
            if (tags.length > 0) return tags;
          }
        }
      }
    } catch (_nextDataErr) {}

    // 2. Expand Topic Tags dropdown if collapsed
    try {
      const allStrongs = doc.querySelectorAll('strong, b, span, div, p, h3, h4, h5, button');
      for (const el of allStrongs) {
        const txt = (el.innerText || el.textContent || '').trim().toLowerCase();
        if (txt === 'topic tags' || txt === 'topic tag' || txt === 'topics') {
          const parent = el.parentElement;
          if (parent) {
            const dropdownBtn = parent.querySelector('button[class*="tag_dropdown"], button[class*="dropdown"]') ||
                                parent.querySelector('button') || (el.tagName === 'BUTTON' ? el : null);
            if (dropdownBtn) {
              dropdownBtn.click();
              await new Promise(r => setTimeout(r, 400));
            }
          }
          break;
        }
      }
    } catch (_expandErr) {}

    // 3. Explicit Topic Selectors (Trusted completely without company checks)
    const explicitTopicSelectors = [
      'a[href*="/problems?topicTags="]',
      'a[href*="/problems?topics="]',
      'a[href*="topicTags="]',
      'a[href*="topics="]',
      '[class*="topicTags"] a, [class*="topicTags"] span, [class*="topicTags"] div[class*="chip"]',
      '[class*="topic-tags"] a, [class*="topic-tags"] span, [class*="topic-tags"] div[class*="chip"]',
      '[class*="topicTag"] a, [class*="topicTag"] span, [class*="topicTag"] div[class*="chip"]',
      '[class*="TopicTag"] a, [class*="TopicTag"] span, [class*="TopicTag"] div[class*="chip"]',
      '[class*="explore_topicTag"] a, [class*="explore_topicTag"] span',
      'a[class*="problems_tag_label"]'
    ];
    for (const sel of explicitTopicSelectors) {
      doc.querySelectorAll(sel).forEach(el => {
        const href = el.getAttribute?.('href') || '';
        if (!href.includes('company=') && !href.includes('company_tag')) {
          addTag(el.innerText, el, true);
        }
      });
    }
    if (tags.length > 0) return tags;

    // 4. Search around Topic Tags headings
    const allHeadings = doc.querySelectorAll('h2, h3, h4, h5, div, span, button, p, strong');
    for (let h of allHeadings) {
      const txt = h.innerText?.trim()?.toLowerCase() || '';
      if (
        (txt.startsWith('topic tag') || txt.startsWith('topics') || txt === 'topic tags' || txt.includes('topic tags')) &&
        !txt.includes('company') &&
        !txt.includes('related') &&
        !txt.includes('article') &&
        !txt.includes('similar')
      ) {
        const containers = [
          h.nextElementSibling,
          h.parentElement?.nextElementSibling,
          h.parentElement,
          h.closest('[class*="accordion"]')
        ];
        for (const container of containers) {
          if (container) {
            const items = container.querySelectorAll('a, span, div[class*="chip"], button, li');
            items.forEach(item => {
              if (item !== h && !h.contains(item)) {
                const href = item.getAttribute?.('href') || '';
                if (!href.includes('company=') && !href.includes('company_tag')) {
                  addTag(item.innerText, item, true);
                }
              }
            });
          }
        }
      }
    }
    if (tags.length > 0) return tags;

    // 5. Generic Tag Selectors with safe context checking
    const genericSelectors = [
      '[class*="tag_container"] a, [class*="tag_container"] span, [class*="tag_container"] div[class*="chip"]',
      '[class*="tagContainer"] a, [class*="tagContainer"] span, [class*="tagContainer"] div[class*="chip"]',
      '[class*="problem_tag"] a, [class*="problem_tag"] span, [class*="problem_tag"] div[class*="chip"]',
      '[class*="problemTags"] a, [class*="problemTags"] span, [class*="problemTags"] div[class*="chip"]',
      '[class*="accordion_tags"] a, [class*="accordion_tags"] span, [class*="accordion_tags"] div[class*="chip"]',
      '[class*="problems_tag"] a, [class*="problems_tag"] span',
      '[class*="pill_tag"] a, [class*="pill_tag"] span',
      'a[href*="/problems?tag="]',
      'a[href*="/problems?category="]',
      'a[href*="/explore?category"]'
    ];
    for (const sel of genericSelectors) {
      doc.querySelectorAll(sel).forEach(el => {
        const href = el.getAttribute?.('href') || '';
        if (!href.includes('company=') && !href.includes('company_tag')) {
          addTag(el.innerText, el, false);
        }
      });
    }

    if (tags.length > 0) return tags;
  } catch (_e) {}
  return [{ name: 'General' }];
}

export function findGfgLanguage(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc) return '.py';
  try {
    const dividerElem = doc.getElementsByClassName('divider text')[0];
    if (dividerElem && dividerElem.innerText) {
      const lang = dividerElem.innerText.split('(')[0].trim();
      if (lang.length > 0 && languages[lang]) {
        return languages[lang];
      }
    }
    const langItems = doc.querySelectorAll(
      'button[class*="lang"], div[class*="lang"], select[class*="lang"], [class*="language"]'
    );
    for (let item of langItems) {
      const text = (item.value || item.innerText || '').trim().split('(')[0].trim();
      if (text && languages[text]) return languages[text];
    }
  } catch (_e) {}
  return '.py';
}

export function _getCodeFromDOM(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc) return '';
  try {
    const textareas = doc.querySelectorAll('textarea');
    for (let ta of textareas) {
      if (ta.value && ta.value.trim().length > 0) {
        if (
          ta.className.includes('ace') ||
          ta.className.includes('monaco') ||
          ta.className.includes('editor') ||
          ta.id.includes('editor') ||
          ta.value.includes(';') ||
          ta.value.includes('def ') ||
          ta.value.includes('class ') ||
          ta.value.includes('function ') ||
          ta.value.includes('#include') ||
          ta.value.includes('import ')
        ) {
          return ta.value;
        }
      }
    }

    const aceLines = doc.querySelectorAll('.ace_line');
    if (aceLines.length > 0) {
      return Array.from(aceLines)
        .map(line => line.innerText || line.textContent || '')
        .join('\n');
    }

    const monacoLines = doc.querySelectorAll('.view-line');
    if (monacoLines.length > 0) {
      return Array.from(monacoLines)
        .map(line => line.innerText || line.textContent || '')
        .join('\n');
    }

    const cmLines = doc.querySelectorAll('.CodeMirror-line');
    if (cmLines.length > 0) {
      return Array.from(cmLines)
        .map(line => line.innerText || line.textContent || '')
        .join('\n');
    }

    const editorEl = doc.querySelector('#ace-editor, .ace_editor, .monaco-editor, [class*="editor"]');
    if (editorEl) {
      const text = editorEl.innerText || editorEl.textContent || '';
      if (text.trim().length > 0) return text;
    }
  } catch (_e) {}
  return '';
}

export function extractTitle(doc = typeof document !== 'undefined' ? document : null, location = typeof window !== 'undefined' ? window.location : null) {
  return findTitle(doc, location);
}

export function extractSlug(doc = typeof document !== 'undefined' ? document : null, location = typeof window !== 'undefined' ? window.location : null) {
  const title = findTitle(doc, location);
  return `${convertToSlug(title)}-gfg`;
}

export function extractDifficulty(doc = typeof document !== 'undefined' ? document : null) {
  return findDifficulty(doc);
}

export function extractTopics(doc = typeof document !== 'undefined' ? document : null) {
  return findTopicTags(doc);
}

export function extractCompanies(doc = typeof document !== 'undefined' ? document : null) {
  const companies = [];
  if (!doc) return companies;

  try {
    const nextDataEl = doc.getElementById('__NEXT_DATA__');
    if (nextDataEl) {
      const nextText = nextDataEl.textContent || nextDataEl.innerText || '';
      if (nextText) {
        const nextData = JSON.parse(nextText);
        const pageProps = nextData?.props?.pageProps;
        let companyTags = pageProps?.initialState?.problemData?.allData?.probData?.tags?.company_tags;
        if (!companyTags || companyTags.length === 0) {
          const deepSearch = (obj, depth = 0) => {
            if (depth > 8 || !obj || companyTags) return;
            if (Array.isArray(obj)) {
              for (const item of obj) deepSearch(item, depth + 1);
            } else if (typeof obj === 'object') {
              for (const [k, v] of Object.entries(obj)) {
                if ((k === 'company_tags' || k === 'companyTags') && Array.isArray(v) && v.length > 0) {
                  companyTags = v;
                  return;
                }
                deepSearch(v, depth + 1);
              }
            }
          };
          deepSearch(pageProps);
        }
        if (companyTags && Array.isArray(companyTags)) {
          for (const tag of companyTags) {
            const name = typeof tag === 'string' ? tag : (tag?.name || tag?.tag || '');
            if (name && !companies.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
              companies.push({ name: name.trim() });
            }
          }
          if (companies.length > 0) return companies;
        }
      }
    }
  } catch (_e) {}

  doc.querySelectorAll('a[class*="company_tag"], [class*="companyTags"] a, [class*="company_tags"] a').forEach(el => {
    const name = el.innerText?.trim();
    if (name && !companies.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      companies.push({ name });
    }
  });

  return companies;
}

export function extractDescription(doc = typeof document !== 'undefined' ? document : null) {
  return extractGfgProblemStatement(doc);
}

export function extractStatement(doc = typeof document !== 'undefined' ? document : null) {
  return extractGfgProblemStatement(doc);
}

export function extractExamples(doc = typeof document !== 'undefined' ? document : null) {
  const statement = extractGfgProblemStatement(doc) || '';
  const examples = [];
  if (!statement) return examples;

  const exampleRegex = /(?:Example\s*\d*:|Input:)([\s\S]*?)(?=(?:Example\s*\d*:|Your Task:|Constraints:|Expected Time Complexity:|$))/gi;
  let match;
  let idx = 1;
  while ((match = exampleRegex.exec(statement)) !== null) {
    const snippet = match[0].trim();
    if (snippet.includes('Output:')) {
      examples.push({ id: idx++, content: snippet });
    }
  }
  return examples;
}

export function extractConstraints(doc = typeof document !== 'undefined' ? document : null) {
  const statement = extractGfgProblemStatement(doc) || '';
  const constraints = [];
  if (!statement) return constraints;

  const parts = statement.split(/Constraints:\s*/i);
  if (parts.length > 1) {
    const lines = parts[1].split(/\n+/);
    for (const line of lines) {
      const clean = line.trim();
      if (clean.startsWith('Expected') || clean.startsWith('Company') || clean.startsWith('Topic') || clean.startsWith('Your Task')) {
        break;
      }
      if (clean && clean.length < 200) {
        constraints.push(clean);
      }
    }
  }
  return constraints;
}

export function extractLanguage(doc = typeof document !== 'undefined' ? document : null) {
  return findGfgLanguage(doc);
}

export function extractCode(doc = typeof document !== 'undefined' ? document : null) {
  return _getCodeFromDOM(doc);
}

export const GfgParser = {
  findProblemContainer,
  removeAuthorMetadata,
  extractGfgProblemStatement,
  findTitle,
  findDifficulty,
  findTopicTags,
  findGfgLanguage,
  _getCodeFromDOM,
  extractTitle,
  extractSlug,
  extractDifficulty,
  extractTopics,
  extractCompanies,
  extractDescription,
  extractStatement,
  extractExamples,
  extractConstraints,
  extractLanguage,
  extractCode,
};
