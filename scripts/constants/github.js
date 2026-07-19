/**
 * Shared GitHub API and OAuth Endpoints/Configuration
 */
export const GITHUB_API = Object.freeze({
  BASE_URL: 'https://api.github.com',
  USER_URL: 'https://api.github.com/user',
  CREATE_REPO_URL: 'https://api.github.com/user/repos',
  REPO_URL_BASE: 'https://api.github.com/repos/',
});

export const GITHUB_OAUTH = Object.freeze({
  ACCESS_TOKEN_URL: 'https://github.com/login/oauth/access_token',
  AUTHORIZATION_URL: 'https://github.com/login/oauth/authorize',
  CLIENT_ID: 'Ov23liBUFoMra3nbAvOJ',
  CLIENT_SECRET: '821eb0ae447fc0956cffabe31acbc46102027477',
  REDIRECT_URL: 'https://github.com/',
  SCOPES: ['repo'],
});
