import { CodingPlatform } from './base.js';
import {
  encode,
  getSolutionFilename,
  getSolutionUploadMode,
  incrementStats,
  MULTI_SOLUTION_MODE,
  uploadGitWith409Retry,
} from '../core/uploader.js';
import {
  convertToSlug,
  getBrowser,
  getPlatformProblemDirectory,
  languages,
} from '../core/util.js';
import { updatePlatformAndRootReadme } from '../leetcode/readmeTopics.js';
import { formatGfgProblemReadme } from './gfgReadme.js';

const README_MSG = 'Create README - AlgoSync';
const SUBMIT_MSG = 'Added solution - AlgoSync';

const api = getBrowser();

export class GeeksForGeeksPlatform extends CodingPlatform {
  constructor() {
    super({
      id: 'geeksforgeeks',
      name: 'GeeksForGeeks',
      folder: 'GeeksForGeeks',
      hostnames: ['practice.geeksforgeeks.org', 'www.geeksforgeeks.org', 'geeksforgeeks.org'],
    });
    this.progressSpinnerElementId = 'leethub_gfg_progress_elem';
    this.progressSpinnerElementClass = 'leethub_gfg_progress';
  }

  injectSpinnerStyle() {
    if (document.getElementById('leethub_gfg_style')) return;
    const style = document.createElement('style');
    style.id = 'leethub_gfg_style';
    style.textContent = `
      .${this.progressSpinnerElementClass} {
        pointer-events: none;
        width: 1.5em;
        height: 1.5em;
        border: 0.3em solid transparent;
        border-color: #eee;
        border-top-color: #3E67EC;
        border-radius: 50%;
        animation: gfg_loadingspin 1s linear infinite;
        display: inline-block;
        vertical-align: middle;
      }
      @keyframes gfg_loadingspin {
        100% { transform: rotate(360deg); }
      }
      .leethub_gfg_success {
        display: inline-block;
        color: #28a745;
        font-weight: bold;
        vertical-align: middle;
      }
      .leethub_gfg_error {
        display: inline-block;
        color: #dc3545;
        font-weight: bold;
        vertical-align: middle;
      }
    `;
    document.head.append(style);
  }

  startSpinner(anchorBtn) {
    this.injectSpinnerStyle();
    let elem = document.getElementById('leethub_gfg_anchor_element');
    if (!elem) {
      elem = document.createElement('span');
      elem.id = 'leethub_gfg_anchor_element';
      elem.style = 'margin-left: 10px; margin-right: 10px; vertical-align: middle;';
      if (anchorBtn && anchorBtn.parentNode) {
        anchorBtn.parentNode.insertBefore(elem, anchorBtn.nextSibling);
      } else {
        document.body.appendChild(elem);
      }
    }
    elem.innerHTML = `<div id="${this.progressSpinnerElementId}" class="${this.progressSpinnerElementClass}" title="AlgoSync uploading..."></div>`;
  }

  markUploaded() {
    const elem = document.getElementById(this.progressSpinnerElementId) || document.getElementById('leethub_gfg_anchor_element');
    if (elem) {
      elem.innerHTML = `<span class="leethub_gfg_success" title="Successfully uploaded to GitHub!">&#10003; Uploaded to GitHub</span>`;
    }
  }

  markUploadFailed() {
    const elem = document.getElementById(this.progressSpinnerElementId) || document.getElementById('leethub_gfg_anchor_element');
    if (elem) {
      elem.innerHTML = `<span class="leethub_gfg_error" title="Upload failed">&#10007; Upload Failed</span>`;
    }
  }

  findGfgLanguage() {
    try {
      const dividerElem = document.getElementsByClassName('divider text')[0];
      if (dividerElem && dividerElem.innerText) {
        const lang = dividerElem.innerText.split('(')[0].trim();
        if (lang.length > 0 && languages[lang]) {
          return languages[lang];
        }
      }
      const langItems = document.querySelectorAll(
        'button[class*="lang"], div[class*="lang"], select[class*="lang"], [class*="language"]'
      );
      for (let item of langItems) {
        const text = (item.value || item.innerText || '').trim().split('(')[0].trim();
        if (text && languages[text]) return languages[text];
      }
    } catch (_e) {}
    return '.py';
  }

  findTitle() {
    // Words that indicate a success/verdict message, NOT a real problem title
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
      // 1. BEST: Extract from URL — always reliable, never changes with modals
      //    URL pattern: geeksforgeeks.org/problems/problem-slug-name1234/1
      const urlMatch = window.location.pathname.match(/\/problems\/([^/]+)/);
      if (urlMatch && urlMatch[1]) {
        const slug = urlMatch[1]
          .replace(/\d+$/, '')      // remove trailing digits like "4428"
          .replace(/-+$/, '')        // remove trailing dashes
          .replace(/-/g, ' ')        // convert dashes to spaces
          .trim();
        if (slug.length > 0) {
          // Title-case the slug
          const titleCased = slug.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          return titleCased;
        }
      }

      // 2. Try the specific GFG problem title selector
      let ele = document.querySelector('[class^="problems_header_content__title"] > h3');
      if (ele && ele.innerText?.trim() && !isSuccessText(ele.innerText.trim())) {
        return ele.innerText.trim();
      }

      // 3. Scan headings but EXCLUDE success/verdict messages
      const headings = document.querySelectorAll('h1, h2, h3, [class*="problem-title"], [class*="problems_title"]');
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

      // 4. Try document.title
      if (document.title) {
        const parts = document.title.split('|');
        const titlePart = parts[0]?.trim();
        if (titlePart && !isSuccessText(titlePart)) return titlePart;
      }
    } catch (_e) {}
    return 'Unknown Problem';
  }

  findDifficulty() {
    try {
      const ele = document.querySelectorAll('[class^="problems_header_description"]')[0]?.children[0]?.innerText;
      if (ele != null) {
        const val = ele.trim();
        if (val === 'Basic' || val === 'School') return 'Easy';
        if (['Easy', 'Medium', 'Hard'].includes(val)) return val;
      }
      const badges = document.querySelectorAll('[class*="badge"], [class*="difficulty"], span, div');
      for (let b of badges) {
        const text = b.innerText?.trim();
        if (text === 'Basic' || text === 'School' || text === 'Easy') return 'Easy';
        if (text === 'Medium') return 'Medium';
        if (text === 'Hard') return 'Hard';
      }
    } catch (_e) {}
    return 'Medium';
  }

  async findTopicTags() {
    try {
      const tags = [];
      const addTag = (text, el = null) => {
        if (!text) return;
        const cleaned = text.trim();
        if (
          cleaned &&
          cleaned.length > 1 &&
          cleaned.length < 35 &&
          !cleaned.includes('\n') &&
          !cleaned.includes('\r') &&
          !['topic tags', 'topic tag', 'company tags', 'company tag', 'tags', 'topics', 'show more', 'hide', 'general', 'practice', 'related articles', 'similar problems', 'companies'].includes(cleaned.toLowerCase()) &&
          !tags.some(t => t.name.toLowerCase() === cleaned.toLowerCase())
        ) {
          // If DOM element provided, verify it is not inside Company Tags, Related Articles, or Similar Problems
          if (el) {
            let cur = el;
            let hops = 0;
            while (cur && cur !== document.body && hops < 6) {
              const cls = cur.className?.toString().toLowerCase() || '';
              const id = cur.id?.toString().toLowerCase() || '';
              if (cls.includes('company') || id.includes('company') || cls.includes('article') || cls.includes('related') || cls.includes('similar')) {
                return;
              }
              const prevTxt = cur.previousElementSibling?.innerText?.trim()?.toLowerCase() || '';
              if (prevTxt.includes('company') || prevTxt.includes('related article') || prevTxt.includes('similar problem')) {
                return;
              }
              cur = cur.parentElement;
              hops++;
            }
          }
          tags.push({ name: cleaned });
        }
      };

      // 0. HIGHEST PRIORITY: Extract tags from __NEXT_DATA__ JSON embedded in the page.
      //    GFG stores topic_tags at known paths inside the Next.js page data.
      //    This is the most reliable source — no DOM manipulation needed.
      try {
        const nextDataEl = document.getElementById('__NEXT_DATA__');
        if (nextDataEl) {
          const nextText = nextDataEl.textContent || nextDataEl.innerText || '';
          if (nextText) {
            const nextData = JSON.parse(nextText);
            const pageProps = nextData?.props?.pageProps;

            // Known paths where GFG stores topic_tags:
            // 1. pageProps.initialState.problemData.allData.probData.tags.topic_tags
            // 2. pageProps.initialState.problemApi.queries.<key>.data.tags.topic_tags
            let topicTags = null;

            // Path 1: Direct access
            topicTags = pageProps?.initialState?.problemData?.allData?.probData?.tags?.topic_tags;

            // Path 2: Search through problemApi queries
            if (!topicTags || topicTags.length === 0) {
              const queries = pageProps?.initialState?.problemApi?.queries;
              if (queries && typeof queries === 'object') {
                for (const [, queryVal] of Object.entries(queries)) {
                  const qt = queryVal?.data?.tags?.topic_tags;
                  if (qt && Array.isArray(qt) && qt.length > 0) {
                    topicTags = qt;
                    break;
                  }
                }
              }
            }

            // Path 3: Deep search for any "topic_tags" key
            if (!topicTags || topicTags.length === 0) {
              const deepSearch = (obj, depth = 0) => {
                if (depth > 8 || !obj || topicTags) return;
                if (Array.isArray(obj)) {
                  for (const item of obj) deepSearch(item, depth + 1);
                } else if (typeof obj === 'object') {
                  for (const [k, v] of Object.entries(obj)) {
                    if (k === 'topic_tags' && Array.isArray(v) && v.length > 0) {
                      topicTags = v;
                      return;
                    }
                    // Also check for "topicTags" (camelCase)
                    if (k === 'topicTags' && Array.isArray(v) && v.length > 0) {
                      topicTags = v;
                      return;
                    }
                    // Skip company/irrelevant keys to save time
                    const lk = k.toLowerCase();
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
                if (typeof tag === 'string') addTag(tag);
                else if (tag && typeof tag === 'object' && tag.name) addTag(tag.name);
                else if (tag && typeof tag === 'object' && tag.tag) addTag(tag.tag);
              }
              console.log('[AlgoSync] findTopicTags from __NEXT_DATA__:', tags);
              if (tags.length > 0) return tags;
            }
          }
        }
      } catch (_nextDataErr) {
        console.log('[AlgoSync] __NEXT_DATA__ extraction failed:', _nextDataErr);
      }

      // 1. Expand the Topic Tags dropdown on GFG if it's collapsed.
      try {
        const allStrongs = document.querySelectorAll('strong, b, span, div, p, h3, h4, h5');
        for (const el of allStrongs) {
          const txt = (el.innerText || el.textContent || '').trim().toLowerCase();
          if (txt === 'topic tags' || txt === 'topic tag') {
            const parent = el.parentElement;
            if (parent) {
              const dropdownBtn = parent.querySelector('button[class*="tag_dropdown"], button[class*="dropdown"]') ||
                                  parent.querySelector('button');
              if (dropdownBtn) {
                const existingTags = parent.querySelectorAll('a[class*="tag_label"], a[href*="/explore?category"]');
                if (existingTags.length === 0) {
                  dropdownBtn.click();
                  await new Promise(r => setTimeout(r, 300));
                }
              }
            }
            break;
          }
        }
      } catch (_expandErr) {
        console.log('[AlgoSync] Topic Tags dropdown expand attempt failed:', _expandErr);
      }

      // 2. GFG-specific tag selectors
      const gfgSpecificSelectors = [
        'a[class*="problems_tag_label"]',
        'a[class*="tag_label"][href*="/explore?category"]',
        'a[href*="/explore?category[]="]',
        'a[href*="/explore?category%5B%5D="]',
      ];
      for (const sel of gfgSpecificSelectors) {
        document.querySelectorAll(sel).forEach(el => {
          let isCompany = false;
          let cur = el;
          let hops = 0;
          while (cur && cur !== document.body && hops < 8) {
            const prevSibling = cur.previousElementSibling;
            if (prevSibling) {
              const prevText = (prevSibling.innerText || prevSibling.textContent || '').trim().toLowerCase();
              if (prevText.includes('company')) {
                isCompany = true;
                break;
              }
            }
            const parentText = cur.parentElement?.querySelector('strong, b')?.innerText?.trim()?.toLowerCase() || '';
            if (parentText.includes('company')) {
              isCompany = true;
              break;
            }
            cur = cur.parentElement;
            hops++;
          }
          if (!isCompany) {
            addTag(el.innerText, el);
          }
        });
      }

      // 3. Heading / Accordion specifically named "Topic Tags" or "Topics"
      if (tags.length === 0) {
        const allHeadings = document.querySelectorAll('h2, h3, h4, h5, div, span, button, p, strong');
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
                    addTag(item.innerText, item);
                  }
                });
              }
            }
          }
        }
      }

      // 4. Explicit topic tag classes
      if (tags.length === 0) {
        const explicitTopicSelectors = [
          '[class*="topicTags"] a, [class*="topicTags"] span, [class*="topicTags"] div[class*="chip"]',
          '[class*="topic-tags"] a, [class*="topic-tags"] span, [class*="topic-tags"] div[class*="chip"]',
          '[class*="topicTag"] a, [class*="topicTag"] span, [class*="topicTag"] div[class*="chip"]',
          '[class*="TopicTag"] a, [class*="TopicTag"] span, [class*="TopicTag"] div[class*="chip"]',
          '[class*="explore_topicTag"] a, [class*="explore_topicTag"] span',
          'a[href*="/problems?topics="]'
        ];
        for (const sel of explicitTopicSelectors) {
          document.querySelectorAll(sel).forEach(el => addTag(el.innerText, el));
        }
      }

      // 5. Generic tag containers
      if (tags.length === 0) {
        const genericSelectors = [
          '[class*="tag_container"] a, [class*="tag_container"] span, [class*="tag_container"] div[class*="chip"]',
          '[class*="tagContainer"] a, [class*="tagContainer"] span, [class*="tagContainer"] div[class*="chip"]',
          '[class*="problem_tag"] a, [class*="problem_tag"] span, [class*="problem_tag"] div[class*="chip"]',
          '[class*="problemTags"] a, [class*="problemTags"] span, [class*="problemTags"] div[class*="chip"]',
          '[class*="accordion_tags"] a, [class*="accordion_tags"] span, [class*="accordion_tags"] div[class*="chip"]',
          '[class*="problems_tag"] a, [class*="problems_tag"] span',
          '[class*="pill_tag"] a, [class*="pill_tag"] span',
          'a[href*="/problems?tag="]',
          'a[href*="/problems?category="]'
        ];
        for (const sel of genericSelectors) {
          document.querySelectorAll(sel).forEach(el => {
            const href = el.getAttribute?.('href') || '';
            if (!href.includes('company=') && !href.includes('company_tag')) {
              addTag(el.innerText, el);
            }
          });
        }
      }

      console.log('[AlgoSync] findTopicTags result:', tags);
      if (tags.length > 0) return tags;
    } catch (_e) {
      console.error('[AlgoSync] findTopicTags error:', _e);
    }
    return [{ name: 'General' }];
  }

  getProblemStatement(title, difficulty) {
    let content = '';
    try {
      const selectors = [
        '[class*="problems_problem_content"]',
        '[class*="problem_content"]',
        '[class*="problemContent"]',
        '[class*="problem-content"]',
        '[class*="problems_description"]',
        '[class*="problem_description"]',
        '[class*="problemDescription"]',
        '[class*="problems_question"]',
        '[class*="problem_question"]',
        '[class*="problemQuestion"]',
        '[class*="problem_para"]',
        '[class*="description_body"]',
        '[class*="question_body"]',
        '.problems_problem_content',
        '.problem-statement',
        '.problem_statement',
        '#problemDescription',
        '#problem_description',
        '#problem-statement',
        '[class*="gfg-problem-description"]',
        '[class*="problem-description"]',
      ];

      let bestEl = null;
      let maxLen = 0;
      for (const sel of selectors) {
        const elements = document.querySelectorAll(sel);
        elements.forEach(ele => {
          if (ele && ele.innerText) {
            const len = ele.innerText.trim().length;
            if (
              len > 30 &&
              len > maxLen &&
              len < (document.body?.innerText?.length || 999999) * 0.8 &&
              !ele.className?.toString().includes('root') &&
              !ele.className?.toString().includes('containerWrapper')
            ) {
              maxLen = len;
              bestEl = ele;
            }
          }
        });
      }

      if (bestEl) {
        content = bestEl.outerHTML;
      }

      // Fallback if no specific selector matched or content is very short
      if (!content || maxLen < 50) {
        const allDivs = document.querySelectorAll('div, section, article');
        allDivs.forEach(div => {
          const txt = div.innerText || '';
          if (
            (txt.includes('Example') || txt.includes('Input:')) &&
            txt.includes('Output:') &&
            txt.length > maxLen &&
            txt.length < (document.body?.innerText?.length || 999999) * 0.7 &&
            !div.className?.toString().includes('root') &&
            !div.className?.toString().includes('containerWrapper')
          ) {
            maxLen = txt.length;
            bestEl = div;
          }
        });
        if (bestEl) {
          content = bestEl.outerHTML;
        }
      }

      // Last fallback: try to get the meta description
      if (!content) {
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && metaDesc.content) {
          content = `<p>${metaDesc.content}</p>`;
        }
      }
    } catch (_e) {}

    // Strip author / contributor metadata from the scraped content.
    // GFG often embeds elements like "Vivek Kumar3 days agoJul 13, 2026 21:57 (GMT +5:30)"
    // inside the problem content container. We remove those nodes so the README
    // only contains the actual question.
    if (content) {
      try {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = content;

        // 1. Remove elements whose class names indicate author / contributor / user info
        const authorSelectors = [
          '[class*="author"]',
          '[class*="contributor"]',
          '[class*="user-info"]',
          '[class*="userInfo"]',
          '[class*="user_info"]',
          '[class*="profile"]',
          '[class*="createdBy"]',
          '[class*="created_by"]',
          '[class*="author_info"]',
          '[class*="authorInfo"]',
          '[class*="problem_author"]',
          '[class*="problemAuthor"]',
          '[class*="submitted_by"]',
          '[class*="submittedBy"]',
          '[class*="posted_by"]',
          '[class*="postedBy"]',
          '[class*="avatar"]',
          '[class*="ago"]',
          '[class*="timestamp"]',
          '[class*="meta_info"]',
          '[class*="metaInfo"]',
        ];
        for (const sel of authorSelectors) {
          wrapper.querySelectorAll(sel).forEach(el => el.remove());
        }

        // 2. Remove any element whose text matches common author/date patterns
        //    e.g. "Vivek Kumar3 days agoJul 13, 2026 21:57 (GMT +5:30)"
        const datePattern = /\d+\s*(days?|hours?|minutes?|mins?|seconds?|secs?|weeks?|months?|years?)\s*ago/i;
        const gmtPattern = /\(GMT\s*[+\-]?\d+:\d+\)/i;
        const walk = (node) => {
          if (!node) return;
          const children = Array.from(node.childNodes);
          for (const child of children) {
            if (child.nodeType === Node.ELEMENT_NODE) {
              const text = (child.innerText || child.textContent || '').trim();
              if (
                (datePattern.test(text) || gmtPattern.test(text)) &&
                text.length < 200 // only short metadata snippets, not real content
              ) {
                child.remove();
              } else {
                walk(child);
              }
            }
          }
        };
        walk(wrapper);

        // Use text rather than the scraped HTML. GFG commonly uses inline spans
        // for the labels in its examples; GitHub consequently rendered the HTML
        // as one long paragraph in the generated README.
        content = (wrapper.innerText || wrapper.textContent || '').trim();
      } catch (_cleanupErr) {
        // If cleanup fails, use original content — still better than nothing
      }
    }

    const questionUrl = window.location.href.split('?')[0];
    return formatGfgProblemReadme(title, difficulty, content, questionUrl);
  }

  getCode() {
    return new Promise((resolve) => {
      try {
        // Remove any previous extraction result
        const existing = document.getElementById('leethub_code_data');
        if (existing) existing.remove();

        // Inject the file-based extractor script (runs in MAIN world, CSP-compliant)
        const script = document.createElement('script');
        script.src = getBrowser().runtime.getURL('scripts/gfg_code_extractor.js');

        script.onload = () => {
          script.remove();
          const codeElem = document.getElementById('leethub_code_data');
          const code = codeElem ? codeElem.textContent : '';
          if (codeElem) codeElem.remove();

          if (code && code.trim().length > 0) {
            console.log('[AlgoSync] Code extracted via editor API, length:', code.length);
            resolve(code);
          } else {
            console.log('[AlgoSync] Editor API returned empty, falling back to DOM');
            resolve(this._getCodeFromDOM());
          }
        };

        script.onerror = () => {
          console.warn('[AlgoSync] Script injection failed, falling back to DOM');
          script.remove();
          resolve(this._getCodeFromDOM());
        };

        (document.head || document.documentElement).appendChild(script);
      } catch (_e) {
        console.error('[AlgoSync] getCode error:', _e);
        resolve(this._getCodeFromDOM());
      }
    });
  }

  /** DOM-based fallback for code extraction (only gets visible lines). */
  _getCodeFromDOM() {
    try {
      // 1. Try textareas
      const textareas = document.querySelectorAll('textarea');
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

      // 2. Try Ace Editor DOM lines
      const aceLines = document.querySelectorAll('.ace_line');
      if (aceLines.length > 0) {
        return Array.from(aceLines)
          .map(line => line.innerText || line.textContent || '')
          .join('\n');
      }

      // 3. Try Monaco Editor DOM lines
      const monacoLines = document.querySelectorAll('.view-line');
      if (monacoLines.length > 0) {
        return Array.from(monacoLines)
          .map(line => line.innerText || line.textContent || '')
          .join('\n');
      }

      // 4. Try CodeMirror DOM lines
      const cmLines = document.querySelectorAll('.CodeMirror-line');
      if (cmLines.length > 0) {
        return Array.from(cmLines)
          .map(line => line.innerText || line.textContent || '')
          .join('\n');
      }

      // 5. Try any editor container text
      const editorEl = document.querySelector('#ace-editor, .ace_editor, .monaco-editor, [class*="editor"]');
      if (editorEl) {
        const text = editorEl.innerText || editorEl.textContent || '';
        if (text.trim().length > 0) return text;
      }
    } catch (_e) {
      console.error('[AlgoSync] DOM fallback error:', _e);
    }
    return '';
  }

  findSubmitButton() {
    try {
      const buttons = document.querySelectorAll('button, div[role="button"], a[role="button"]');
      for (let btn of buttons) {
        const text = (btn.innerText || btn.textContent || '').trim().toLowerCase();
        if (text === 'submit' || text === 'submit code') {
          return btn;
        }
      }
      const xpathBtn = document.evaluate(
        ".//button[contains(.,'Submit')]",
        document.body,
        null,
        XPathResult.ANY_TYPE,
        null
      ).iterateNext();
      if (xpathBtn) return xpathBtn;
    } catch (_e) {}
    return null;
  }

  checkSubmissionSuccess() {
    try {
      const outputContainers = document.querySelectorAll(
        '[class*="problems_content"], [class*="output"], [class*="result"], [class*="submission"], [class*="modal"], [role="alert"], [class*="success"], [class*="verdict"], div, span'
      );
      const successKeywords = [
        'problem solved successfully',
        'all test cases passed',
        'correct answer',
      ];
      for (let el of outputContainers) {
        if (el.children && el.children.length > 15) continue;
        const text = (el.innerText || el.textContent || '').trim().toLowerCase();
        if (successKeywords.some(kw => text.includes(kw))) {
          if (!text.includes('click submit') && !text.includes('to see output')) {
            return true;
          }
        }
      }
    } catch (_e) {}
    return false;
  }

  async startSubmissionMonitor(submitBtn) {
    let START_MONITOR = true;
    this.startSpinner(submitBtn);

    // CRITICAL: Capture ALL DOM-dependent data NOW, BEFORE the success modal appears
    // and potentially overwrites the DOM with "Problem Solved Successfully"
    const cachedTitle = this.findTitle();
    const cachedDifficulty = this.findDifficulty();
    const cachedProblemStatement = this.getProblemStatement(cachedTitle, cachedDifficulty);
    const cachedTopicTags = await this.findTopicTags();
    const cachedLanguage = this.findGfgLanguage() || '.py';
    console.log('[AlgoSync] Cached at submit time — title:', cachedTitle, 'difficulty:', cachedDifficulty, 'tags:', cachedTopicTags, 'lang:', cachedLanguage);

    let attempts = 0;
    const submissionInterval = setInterval(async () => {
      attempts++;
      if (attempts > 180) { // Timeout after 3 minutes
        clearInterval(submissionInterval);
        return;
      }

      if (this.checkSubmissionSuccess() && START_MONITOR) {
        START_MONITOR = false;
        clearInterval(submissionInterval);

        try {
          const title = cachedTitle || this.findTitle();
          if (!title) {
            this.markUploadFailed();
            return;
          }

          const difficulty = cachedDifficulty;
          const problemStatement = cachedProblemStatement;
          const code = await this.getCode();
          const language = cachedLanguage;
          const problemSlug = `${convertToSlug(title)}-gfg`;
          const fullProblemDirectory = getPlatformProblemDirectory(this.folder, problemSlug);

          const solutionUploadMode = await getSolutionUploadMode();
          const filename = await getSolutionFilename(
            fullProblemDirectory,
            language,
            solutionUploadMode
          );
          if (!filename) {
            this.markUploadFailed();
            return;
          }

          console.log('[AlgoSync] Starting uploads — dir:', fullProblemDirectory, 'file:', filename, 'codeLen:', (code || '').length);

          // SEQUENTIAL uploads with delays to avoid GitHub 409 conflicts
          // (concurrent commits to the same branch cause race conditions)

          // Step 1: Upload solution code first (most important)
          let codeUploaded = false;
          try {
            if (code) {
              await uploadGitWith409Retry(
                encode(code),
                problemSlug,
                filename,
                SUBMIT_MSG,
                {
                  neverOverwrite: solutionUploadMode === MULTI_SOLUTION_MODE,
                },
                this.folder
              );
            }
            codeUploaded = true;
            console.log('[AlgoSync] Solution upload succeeded');
          } catch (codeErr) {
            console.error('[AlgoSync] Solution upload failed:', codeErr);
          }

          // Step 2: Wait for GitHub to settle, then upload problem README
          await new Promise(r => setTimeout(r, 500));
          try {
            await uploadGitWith409Retry(
              encode(problemStatement),
              problemSlug,
              'README.md',
              README_MSG,
              undefined,
              this.folder
            );
            console.log('[AlgoSync] README upload succeeded');
          } catch (readmeErr) {
            console.error('[AlgoSync] README upload failed:', readmeErr);
          }

          // Step 3: Wait again, then update platform + root READMEs
          await new Promise(r => setTimeout(r, 500));
          try {
            await updatePlatformAndRootReadme(
              cachedTopicTags,
              fullProblemDirectory,
              problemSlug,
              title,
              this.folder,
              this.name
            );
            console.log('[AlgoSync] Platform README update succeeded');
          } catch (platformErr) {
            console.error('[AlgoSync] Platform README update failed:', platformErr);
          }

          if (codeUploaded) {
            incrementStats(difficulty, fullProblemDirectory);
            this.markUploaded();
          } else {
            this.markUploadFailed();
          }
        } catch (err) {
          console.error('[AlgoSync] GFG upload failed:', err);
          this.markUploadFailed();
        }
      }
    }, 1000);
  }

  init() {
    this.injectSpinnerStyle();

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        if (this.match(window.location.href)) {
          const submitBtn = this.findSubmitButton();
          this.startSubmissionMonitor(submitBtn);
        }
      }
    });

    setInterval(() => {
      if (this.match(window.location.href)) {
        const submitBtn = this.findSubmitButton();
        if (submitBtn && !submitBtn.hasAttribute('data-leethub-bound')) {
          submitBtn.setAttribute('data-leethub-bound', 'true');
          submitBtn.addEventListener('click', () => {
            this.startSubmissionMonitor(submitBtn);
          });
        }
      }
    }, 1500);
  }
}
