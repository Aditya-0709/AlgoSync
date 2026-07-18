/**
 * Folder and repository path generator module.
 * Receives plain JavaScript strings/objects and returns repository folder or file paths.
 */

/**
 * Constructs a platform-specific problem directory path.
 * @param {string} platformFolder - e.g. "LeetCode", "GeeksForGeeks"
 * @param {string} problemSlug - problem directory slug e.g. "0001-two-sum"
 * @returns {string} e.g. "LeetCode/0001-two-sum"
 */
export function getPlatformProblemDirectory(platformFolder, problemSlug) {
  if (!problemSlug) return `${platformFolder}`;
  if (problemSlug.startsWith('DSA/')) return problemSlug.slice(4);
  if (problemSlug.startsWith(`${platformFolder}/`)) return problemSlug;
  return `${platformFolder}/${problemSlug}`;
}

/**
 * Constructs the directory path where a platform's main README is stored.
 * @param {string} platformFolder - e.g. "LeetCode", "GeeksForGeeks"
 * @returns {string} e.g. "LeetCode"
 */
export function getPlatformReadmeDirectory(platformFolder) {
  return `${platformFolder}`;
}

/**
 * Joins a directory and a filename into a clean repository file path.
 * @param {string} directory - directory path
 * @param {string} filename - file name
 * @returns {string} e.g. "LeetCode/0001-two-sum/Solution.js"
 */
export function getPath(directory, filename) {
  const cleanDir = (directory || '').replace(/^\/+|\/+$/g, '');
  const cleanFile = (filename || '').replace(/^\/+/, '');
  if (!cleanDir) return cleanFile;
  return cleanFile ? `${cleanDir}/${cleanFile}` : cleanDir;
}

export const FolderGenerator = {
  getPlatformProblemDirectory,
  getPlatformReadmeDirectory,
  getPath,
};
export default FolderGenerator;
