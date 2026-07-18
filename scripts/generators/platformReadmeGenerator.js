/**
 * Platform README generator module.
 * Responsible only for generating and updating platform-level (LeetCode / GeeksForGeeks) README markdown strings.
 */
import { LeetHubError } from '../utils/helpers.js';

export function getSectionStart(platformName = 'LeetCode', markdownFile = '') {
  const specificStart = `<!---${platformName} Topics Start-->`;
  const generalStart = `<!---Topics Start-->`;
  const legacyStart = `<!---LeetCode Topics Start-->`;

  if (markdownFile && markdownFile.includes(specificStart)) return specificStart;
  if (markdownFile && markdownFile.includes(generalStart)) return generalStart;
  if (markdownFile && markdownFile.includes(legacyStart)) return legacyStart;
  return specificStart;
}

export function getSectionEnd(platformName = 'LeetCode', markdownFile = '') {
  const specificEnd = `<!---${platformName} Topics End-->`;
  const generalEnd = `<!---Topics End-->`;
  const legacyEnd = `<!---LeetCode Topics End-->`;

  if (markdownFile && markdownFile.includes(specificEnd)) return specificEnd;
  if (markdownFile && markdownFile.includes(generalEnd)) return generalEnd;
  if (markdownFile && markdownFile.includes(legacyEnd)) return legacyEnd;
  return specificEnd;
}

export function getDefaultPlatformReadme(platformName = 'LeetCode') {
  return `# ${platformName} Solutions\n\n<!---${platformName} Topics Start-->\n<!---${platformName} Topics End-->\n`;
}

export function appendProblemToReadme(topic, markdownFile, hook, problemDirectory, problemTitle, platformName = 'LeetCode') {
  if (!topic) topic = 'General';
  const url = `https://github.com/${hook}/tree/master/${problemDirectory}`;
  const topicHeader = `## ${topic}`;

  const slug = problemDirectory ? problemDirectory.split('/').pop() : '';
  const titleText = problemTitle || slug || problemDirectory;
  const newRow = `- [${titleText}](${url})`;

  const sectionStart = getSectionStart(platformName, markdownFile);
  const sectionEnd = getSectionEnd(platformName, markdownFile);

  let startIndex = markdownFile.indexOf(sectionStart);
  if (startIndex === -1) {
    const header = `# ${platformName} Solutions`;
    if (!markdownFile.trim()) {
      markdownFile = `${header}\n\n${sectionStart}\n${sectionEnd}\n`;
    } else if (markdownFile.includes(header)) {
      const headerIdx = markdownFile.indexOf(header) + header.length;
      markdownFile =
        markdownFile.slice(0, headerIdx) +
        `\n\n${sectionStart}\n${sectionEnd}` +
        markdownFile.slice(headerIdx);
    } else {
      markdownFile += `\n\n${sectionStart}\n${sectionEnd}\n`;
    }
    startIndex = markdownFile.indexOf(sectionStart);
  }

  const beforeSection = markdownFile.slice(0, startIndex);
  const endIndex = markdownFile.indexOf(sectionEnd);
  const afterSection = markdownFile.slice(endIndex + sectionEnd.length);
  let sectionContent = markdownFile.slice(startIndex + sectionStart.length, endIndex);

  let topicHeaderIdx = sectionContent.indexOf(topicHeader);
  if (topicHeaderIdx === -1) {
    sectionContent = sectionContent.trimEnd() + `\n\n${topicHeader}\n${newRow}\n\n`;
  } else {
    const nextTopicIdx = sectionContent.indexOf('\n## ', topicHeaderIdx + topicHeader.length);
    let topicSection =
      nextTopicIdx === -1
        ? sectionContent.slice(topicHeaderIdx)
        : sectionContent.slice(topicHeaderIdx, nextTopicIdx);

    const exactSlugCheck = problemDirectory && (topicSection.includes(`/${slug})`) || topicSection.includes(`/${problemDirectory})`) || topicSection.includes(problemDirectory));
    const exactTitleCheck = titleText && (topicSection.includes(`[${titleText}]`) || topicSection.includes(`- ${titleText}\n`));
    if (exactSlugCheck || exactTitleCheck) {
      return markdownFile;
    }

    topicSection = topicSection.trimEnd() + `\n${newRow}\n`;
    if (nextTopicIdx === -1) {
      sectionContent = sectionContent.slice(0, topicHeaderIdx) + topicSection + '\n';
    } else {
      sectionContent =
        sectionContent.slice(0, topicHeaderIdx) +
        topicSection +
        '\n' +
        sectionContent.slice(nextTopicIdx);
    }
  }

  return [beforeSection, sectionStart, sectionContent, sectionEnd, afterSection].join('');
}

export function sortTopicsInReadme(markdownFile, platformName = 'LeetCode') {
  const sectionStart = getSectionStart(platformName, markdownFile);
  const sectionEnd = getSectionEnd(platformName, markdownFile);

  const startIndex = markdownFile.indexOf(sectionStart);
  const endIndex = markdownFile.indexOf(sectionEnd);
  if (startIndex === -1 || endIndex === -1) {
    throw new LeetHubError('LeetCodeTopicSectionNotFound');
  }

  const beforeSection = markdownFile.slice(0, startIndex + sectionStart.length);
  const afterSection = markdownFile.slice(endIndex);
  const sectionContent = markdownFile.slice(startIndex + sectionStart.length, endIndex);

  const firstTopicIdx = sectionContent.indexOf('## ');
  if (firstTopicIdx === -1) {
    return markdownFile;
  }

  const headerPrefix = sectionContent.slice(0, firstTopicIdx);
  const topicsRaw = sectionContent.slice(firstTopicIdx).replace(/^##\s+/, '').split(/\n##\s+/);

  const reconstructedTopics = topicsRaw.map(chunk => {
    const lines = chunk.trim().split('\n');
    const topicName = lines.shift().trim();

    const cleanItems = [];
    const seenIds = new Set();

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('| --') || line === '|  |') {
        continue;
      }
      if (line.startsWith('|')) {
        line = line.replace(/^\|\s*/, '- ').replace(/\s*\|$/, '').trim();
      }

      const urlMatch = line.match(/\(([^)]+)\)/);
      const titleMatch = line.match(/\[([^\]]+)\]/) || line.match(/^[-*+]\s+(.+)$/);
      const id = urlMatch ? urlMatch[1] : (titleMatch ? titleMatch[1].toLowerCase() : line.toLowerCase());

      if (!seenIds.has(id)) {
        seenIds.add(id);
        cleanItems.push(line);
      }
    }

    cleanItems.sort((a, b) => {
      const getTitle = item => {
        const m = item.match(/\[([^\]]+)\]/) || item.match(/^[-*+]\s+(.+)$/);
        if (m) {
          const name = m[1].trim();
          const numPrefix = name.match(/^\d+-(.+)$/);
          if (numPrefix) {
            return numPrefix[1].replace(/-/g, ' ').toLowerCase();
          }
          return name.toLowerCase();
        }
        return item.toLowerCase();
      };
      return getTitle(a).localeCompare(getTitle(b), undefined, { sensitivity: 'base' });
    });

    return `## ${topicName}\n` + cleanItems.join('\n');
  });

  const body = headerPrefix + reconstructedTopics.join('\n\n') + '\n\n';
  return beforeSection + body + afterSection;
}

/**
 * Generates or updates the complete platform README content string.
 * @param {Object} options
 * @param {string} [options.existingContent=''] - Existing platform README markdown
 * @param {Array|Object} [options.topicTags=[]] - Topic tags array
 * @param {string} options.problemDirectory - Problem directory path in repo
 * @param {string} options.problemTitle - Problem title
 * @param {string} [options.platformName='LeetCode'] - Platform display name
 * @param {string} [options.repoHook=''] - GitHub repository full name
 * @returns {string} Complete updated markdown string
 */
export function generatePlatformReadmeContent({ existingContent = '', topicTags = [], problemDirectory = '', problemTitle = '', platformName = 'LeetCode', repoHook = '' }) {
  let readme = existingContent || getDefaultPlatformReadme(platformName);
  const tags = (topicTags && topicTags.length > 0) ? topicTags : [{ name: 'General' }];
  for (let topic of tags) {
    const topicName = typeof topic === 'string' ? topic : (topic.name || 'General');
    readme = appendProblemToReadme(topicName, readme, repoHook, problemDirectory, problemTitle, platformName);
  }
  readme = sortTopicsInReadme(readme, platformName);
  return readme;
}

export const PlatformReadmeGenerator = {
  getSectionStart,
  getSectionEnd,
  getDefaultPlatformReadme,
  appendProblemToReadme,
  sortTopicsInReadme,
  generatePlatformReadmeContent,
};
export default PlatformReadmeGenerator;
