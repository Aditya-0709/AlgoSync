/**
 * Main repository README generator module.
 * Responsible only for generating and updating repository-level README markdown strings.
 */

export function getRootReadmeTemplate() {
  return [
    '# 📚 DSA',
    '',
    'My collection of Data Structures & Algorithms solutions from **LeetCode** and **GeeksforGeeks**.',
    '',
    'Automatically maintained using **AlgoSync**.',
    '',
    '---',
    '',
    '## Platforms',
    '',
    '- 🟡 LeetCode',
    '- 🟢 GeeksforGeeks',
    '',
    '---',
    '',
    '> ⚡ This repository is automatically updated whenever a new accepted solution is synchronized through AlgoSync.',
    '',
  ].join('\n');
}

export function isDefaultRootReadme(content = '') {
  const trimmed = content.trim();
  if (!trimmed) return true;
  if (trimmed.includes('A collection of LeetCode & coding solutions auto-synced with AlgoSync.')) return true;
  if (trimmed.includes('A collection of LeetCode questions to ace the coding interview!')) return true;
  if (trimmed.includes('Automatically maintained using **AlgoSync**.')) return true;

  const withoutMarkers = trimmed
    .replace(/<!---Platforms Start-->[\s\S]*?<!---Platforms End-->/g, '')
    .trim();
  const lines = withoutMarkers.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 1 && lines[0].startsWith('# ')) return true;
  if (lines.length === 0) return true;

  return false;
}

export function generateRootReadmeSummary(platformCounts = {}, totalSolved = 0) {
  const sortedPlatforms = Object.keys(platformCounts).sort();
  const summaryLines = [
    '## Platforms',
    '',
  ];
  for (const platform of sortedPlatforms) {
    const count = platformCounts[platform];
    summaryLines.push(`- ${platform} : ${count} Problem${count === 1 ? '' : 's'}`);
  }
  summaryLines.push('', `Total Solved : ${totalSolved}`);
  return summaryLines.join('\n');
}

/**
 * Generates or updates the complete root/DSA directory README content string.
 * @param {Object} options
 * @param {string} [options.existingContent=''] - Existing markdown content
 * @param {string} [options.directory=''] - '' for root, 'DSA' for DSA/
 * @param {Object} [options.platformCounts={}] - e.g. { LeetCode: 15, GeeksForGeeks: 10 }
 * @param {number} [options.totalSolved=0] - total solved count
 * @returns {string} Complete markdown string ready for upload
 */
export function generateRootReadmeContent({ existingContent = '', directory = '', platformCounts = {}, totalSolved = 0 }) {
  const summaryBlock = generateRootReadmeSummary(platformCounts, totalSolved);
  const startMarker = `<!---Platforms Start-->`;
  const endMarker = `<!---Platforms End-->`;

  let rootReadme = existingContent || '';
  if (!rootReadme.includes(startMarker)) {
    if (directory === '' && isDefaultRootReadme(rootReadme)) {
      rootReadme = `${getRootReadmeTemplate()}\n${startMarker}\n${summaryBlock}\n${endMarker}\n`;
    } else if (!rootReadme.trim()) {
      if (directory === '') {
        rootReadme = `${getRootReadmeTemplate()}\n${startMarker}\n${summaryBlock}\n${endMarker}\n`;
      } else {
        rootReadme = `# DSA Repository\n\n${startMarker}\n${summaryBlock}\n${endMarker}\n`;
      }
    } else if (rootReadme.includes('# DSA Repository')) {
      const idx = rootReadme.indexOf('# DSA Repository') + '# DSA Repository'.length;
      rootReadme = rootReadme.slice(0, idx) + `\n\n${startMarker}\n${summaryBlock}\n${endMarker}` + rootReadme.slice(idx);
    } else {
      rootReadme = `${rootReadme.trim()}\n\n${startMarker}\n${summaryBlock}\n${endMarker}\n`;
    }
  } else {
    const startIdx = rootReadme.indexOf(startMarker);
    const endIdx = rootReadme.indexOf(endMarker);
    let before = rootReadme.slice(0, startIdx);
    const after = endIdx !== -1 ? rootReadme.slice(endIdx + endMarker.length) : '';
    if (directory === '' && isDefaultRootReadme(before)) {
      before = `${getRootReadmeTemplate()}\n`;
    }
    rootReadme = `${before.trimRight()}\n\n${startMarker}\n${summaryBlock}\n${endMarker}${after}`;
  }
  return rootReadme;
}

export const MainReadmeGenerator = {
  getRootReadmeTemplate,
  isDefaultRootReadme,
  generateRootReadmeSummary,
  generateRootReadmeContent,
};
export default MainReadmeGenerator;
