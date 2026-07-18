import { GeeksForGeeksPlatform } from './geeksforgeeks.js';
import { LeetCodePlatform } from './leetcode.js';

/** All coding-platform integrations supported by the extension. */
export const platforms = [
  new LeetCodePlatform(),
  new GeeksForGeeksPlatform(),
];

export function detectPlatform(url = window.location.href) {
  return platforms.find(platform => platform.match(url)) || null;
}
