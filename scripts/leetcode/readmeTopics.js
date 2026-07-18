import { decode, encode, getGitHubFile, upload, WAIT_FOR_GITHUB_API_TO_NOT_THROW_409_MS } from '../core/uploader.js';
import { delay, getBrowser, LeetHubError, normalizeGitHubRepoName } from './util.js';

const api = getBrowser();

function getSectionStart(platformName, markdownFile) {
  const specificStart = `<!---${platformName} Topics Start-->`;
  const generalStart = `<!---Topics Start-->`;
  const legacyStart = `<!---LeetCode Topics Start-->`;

  if (markdownFile && markdownFile.includes(specificStart)) return specificStart;
  if (markdownFile && markdownFile.includes(generalStart)) return generalStart;
  if (markdownFile && markdownFile.includes(legacyStart)) return legacyStart;
  return specificStart;
}

function getSectionEnd(platformName, markdownFile) {
  const specificEnd = `<!---${platformName} Topics End-->`;
  const generalEnd = `<!---Topics End-->`;
  const legacyEnd = `<!---LeetCode Topics End-->`;

  if (markdownFile && markdownFile.includes(specificEnd)) return specificEnd;
  if (markdownFile && markdownFile.includes(generalEnd)) return generalEnd;
  if (markdownFile && markdownFile.includes(legacyEnd)) return legacyEnd;
  return specificEnd;
}

function appendProblemToReadme(topic, markdownFile, hook, problemDirectory, problemTitle, platformName = 'LeetCode') {
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

    // Check if problem already exists in this topic section (prevent duplicate add)
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

function sortTopicsInReadme(markdownFile, platformName = 'LeetCode') {
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
      // Convert legacy table row to bullet format if found
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

async function uploadReadmeFileWithRetry(token, hook, content, directory, filename, commitMsg, sha = '') {
  try {
    return await upload(token, hook, content, directory, filename, sha, commitMsg);
  } catch (err) {
    if (err.message === '409' || err.message === '422' || err.message === '404') {
      try {
        const data = await getGitHubFile(token, hook, directory, filename).then(res => res.json());
        return await upload(token, hook, content, directory, filename, data.sha, commitMsg);
      } catch (fileErr) {
        if ((fileErr.message === '404' || err.message === '404') && sha) {
          return await upload(token, hook, content, directory, filename, '', commitMsg);
        }
        if (fileErr.message === '404' && !sha) {
          await delay(() => Promise.resolve(), WAIT_FOR_GITHUB_API_TO_NOT_THROW_409_MS);
          return await upload(token, hook, content, directory, filename, '', commitMsg);
        }
        throw fileErr;
      }
    }
    throw err;
  }
}

function generateRootReadmeSummary(platformCounts, totalSolved) {
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

async function updatePlatformReadme(topicTags, problemDirectory, problemTitle, platformFolder, platformName) {
  const { leethub_token, leethub_hook, stats } = await api.storage.local.get([
    'leethub_token',
    'leethub_hook',
    'stats',
  ]);
  const repo = normalizeGitHubRepoName(leethub_hook);
  const platformReadmeDir = `DSA/${platformFolder}`;
  const platformReadmeFile = 'README.md';

  let readme;
  let sha = '';

  try {
    const res = await getGitHubFile(
      leethub_token,
      repo,
      platformReadmeDir,
      platformReadmeFile
    ).then(resp => resp.json());
    readme = res.content;
    sha = res.sha;
    if (!stats.shas[platformReadmeDir]) stats.shas[platformReadmeDir] = {};
    stats.shas[platformReadmeDir][platformReadmeFile] = sha;
    await api.storage.local.set({ stats });
  } catch (err) {
    if (err.message === '404') {
      const defaultReadme = `# ${platformName} Solutions\n\n<!---${platformName} Topics Start-->\n<!---${platformName} Topics End-->\n`;
      sha = await uploadReadmeFileWithRetry(
        leethub_token,
        repo,
        encode(defaultReadme),
        platformReadmeDir,
        platformReadmeFile,
        `Create ${platformName} README - AlgoSync`
      );
      readme = encode(defaultReadme);
      if (!stats.shas[platformReadmeDir]) stats.shas[platformReadmeDir] = {};
      stats.shas[platformReadmeDir][platformReadmeFile] = sha;
      await api.storage.local.set({ stats });
    } else {
      throw err;
    }
  }

  readme = decode(readme);

  const tags = (topicTags && topicTags.length > 0) ? topicTags : [{ name: 'General' }];
  for (let topic of tags) {
    const topicName = typeof topic === 'string' ? topic : (topic.name || 'General');
    readme = appendProblemToReadme(topicName, readme, repo, problemDirectory, problemTitle, platformName);
  }
  readme = sortTopicsInReadme(readme, platformName);
  const encodedReadme = encode(readme);

  return delay(
    () => uploadReadmeFileWithRetry(leethub_token, repo, encodedReadme, platformReadmeDir, platformReadmeFile, `Update ${platformName} README - Topic Tags`, sha),
    WAIT_FOR_GITHUB_API_TO_NOT_THROW_409_MS
  );
}

async function updateRootReadme(leethub_token, repo, stats) {
  const platformCounts = {};
  let totalSolved = 0;
  const shas = stats?.shas || {};

  for (const directoryKey of Object.keys(shas)) {
    if (!directoryKey || directoryKey === 'README.md' || directoryKey === 'stats.json' || directoryKey.endsWith('/README.md') || directoryKey.endsWith('/NOTES.md')) {
      continue;
    }
    if (directoryKey === 'DSA' || directoryKey === 'DSA/LeetCode' || directoryKey === 'DSA/GeeksForGeeks' || directoryKey === 'LeetCode' || directoryKey === 'GeeksForGeeks') {
      continue;
    }
    if (directoryKey.startsWith('DSA/')) {
      const parts = directoryKey.split('/');
      if (parts.length >= 3) {
        const platform = parts[1];
        platformCounts[platform] = (platformCounts[platform] || 0) + 1;
        totalSolved++;
      }
    } else if (directoryKey.includes('-') && shas[directoryKey] && typeof shas[directoryKey] === 'object') {
      platformCounts['LeetCode'] = (platformCounts['LeetCode'] || 0) + 1;
      totalSolved++;
    }
  }

  const summaryBlock = generateRootReadmeSummary(platformCounts, totalSolved);
  const startMarker = `<!---Platforms Start-->`;
  const endMarker = `<!---Platforms End-->`;

  const directoriesToUpdate = ['DSA', ''];
  for (const directory of directoriesToUpdate) {
    let rootReadme;
    let sha = '';
    try {
      const res = await getGitHubFile(leethub_token, repo, directory, 'README.md').then(resp => resp.json());
      rootReadme = decode(res.content);
      sha = res.sha;
    } catch (err) {
      if (err.message === '404') {
        rootReadme = `# DSA Repository\n\n${startMarker}\n${summaryBlock}\n${endMarker}\n`;
      } else {
        throw err;
      }
    }

    if (!rootReadme.includes(startMarker)) {
      if (!rootReadme.trim()) {
        rootReadme = `# DSA Repository\n\n${startMarker}\n${summaryBlock}\n${endMarker}\n`;
      } else if (rootReadme.includes('# DSA Repository')) {
        const idx = rootReadme.indexOf('# DSA Repository') + '# DSA Repository'.length;
        rootReadme = rootReadme.slice(0, idx) + `\n\n${startMarker}\n${summaryBlock}\n${endMarker}` + rootReadme.slice(idx);
      } else {
        rootReadme += `\n\n${startMarker}\n${summaryBlock}\n${endMarker}\n`;
      }
    } else {
      const startIdx = rootReadme.indexOf(startMarker);
      const endIdx = rootReadme.indexOf(endMarker);
      const before = rootReadme.slice(0, startIdx + startMarker.length);
      const after = rootReadme.slice(endIdx);
      rootReadme = `${before}\n${summaryBlock}\n${after}`;
    }

    const encodedRootReadme = encode(rootReadme);
    const newSha = await uploadReadmeFileWithRetry(leethub_token, repo, encodedRootReadme, directory, 'README.md', 'Update Root README - AlgoSync', sha);
    const storageKey = directory ? `${directory}/README.md` : 'README.md';
    if (!stats.shas[storageKey]) stats.shas[storageKey] = {};
    stats.shas[storageKey][''] = newSha;
    await delay(() => Promise.resolve(), WAIT_FOR_GITHUB_API_TO_NOT_THROW_409_MS);
  }

  await api.storage.local.set({ stats });
}

async function updatePlatformAndRootReadme(topicTags, problemDirectory, problemSlug, problemTitle, platformFolder, platformName) {
  try {
    await updatePlatformReadme(topicTags, problemDirectory, problemTitle, platformFolder, platformName);
    console.log(`[AlgoSync] ${platformName} Platform README update succeeded`);
  } catch (err) {
    console.error(`[AlgoSync] Platform README update failed:`, err);
  }

  await delay(() => Promise.resolve(), WAIT_FOR_GITHUB_API_TO_NOT_THROW_409_MS);

  try {
    const { leethub_token, leethub_hook, stats } = await api.storage.local.get([
      'leethub_token',
      'leethub_hook',
      'stats',
    ]);
    const repo = normalizeGitHubRepoName(leethub_hook);
    await updateRootReadme(leethub_token, repo, stats);
    console.log(`[AlgoSync] Root README update succeeded`);
  } catch (err) {
    console.error(`[AlgoSync] Root README update failed:`, err);
  }
}

export {
  appendProblemToReadme,
  sortTopicsInReadme,
  updatePlatformReadme,
  updateRootReadme,
  updatePlatformAndRootReadme,
  generateRootReadmeSummary,
};
