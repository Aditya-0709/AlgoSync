/**
 * Generic reusable utility helpers across AlgoSync.
 */

export function isEmptyObject(obj) {
  for (const prop in obj) {
    if (Object.hasOwn(obj, prop)) {
      return false;
    }
  }
  return true;
}

/**
 * Returns a function that can be immediately invoked but will start
 * a timeout of 'wait' milliseconds before it can be called again.
 * @param {Function} func to be called after wait
 * @param {number} wait time in ms
 * @param {boolean} invokeBeforeTimeout true if you want to invoke func before waiting
 * @returns {Function}
 */
export function debounce(func, wait, invokeBeforeTimeout) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    const later = function () {
      timeout = null;
      if (!invokeBeforeTimeout) func.apply(context, args);
    };
    const callNow = invokeBeforeTimeout && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

/**
 * Delays the execution of a function by the specified time (in milliseconds)
 * and then executes the function with the provided arguments.
 *
 * @param {Function} func - The function to be executed after the delay.
 * @param {number} wait - The number of milliseconds to wait before executing the function.
 * @param {...*} [args] - Additional arguments to pass to the function when it is called.
 * @returns {Promise<*>} A promise that resolves with the result of the function execution.
 */
export function delay(func, wait, ...args) {
  return new Promise(resolve => setTimeout(() => resolve(func(...args)), wait));
}

/**
 * Checks if an HTML Collection exists and has elements
 * @param {HTMLCollectionOf<Element>} elem
 * @returns {boolean}
 */
export function checkElem(elem) {
  return elem && elem.length > 0;
}

/** @param {string} string @returns {string} problem slug, e.g. 0001-two-sum */
export function convertToSlug(string) {
  const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;';
  const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------';
  const p = new RegExp(a.split('').join('|'), 'g');

  return string
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word characters
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

export function isObject(obj) {
  return obj && typeof obj === 'object' && !Array.isArray(obj);
}

export function mergeDeep(target, source) {
  for (const key in source) {
    if (isObject(source[key])) {
      if (!target[key]) {
        Object.assign(target, { [key]: {} });
      }
      mergeDeep(target[key], source[key]);
    } else {
      Object.assign(target, { [key]: source[key] });
    }
  }
}

export class LeetHubError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'LeetHubErr';
  }
}

export function assert(truthy, msg) {
  if (!truthy) {
    throw new LeetHubError(msg);
  }
}

/**
 * @returns {chrome | browser} namespace of browser extension api
 */
export function getBrowser() {
  if (typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined') {
    return chrome;
  } else if (
    (typeof process !== 'undefined' && process.release && process.release.name === 'node') ||
    typeof jasmine !== 'undefined'
  ) {
    return {
      storage: {
        local: {
          get: () => Promise.resolve({}),
          set: () => Promise.resolve(),
        },
      },
      runtime: {
        sendMessage: () => {},
      },
    };
  } else {
    throw new LeetHubError('BrowserNotSupported');
  }
}

export { DIFFICULTY, getDifficulty, addLeadingZeros } from '../models/Problem.js';
export { languages } from '../models/Solution.js';
export { normalizeGitHubRepoName, getGitHubRepoUrl } from '../models/Repository.js';
export { formatStats, mergeStats } from '../models/Statistics.js';
export { getPlatformProblemDirectory } from '../generators/folderGenerator.js';

