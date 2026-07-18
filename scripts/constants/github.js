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
  CLIENT_ID: '0114dd35b156d4729fac',
  CLIENT_SECRET: 'cfc3301d9745530bf1b31e92528ad9c31fd3f995',
  REDIRECT_URL: 'https://github.com/',
  SCOPES: ['repo'],
});
