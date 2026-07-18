import { decode, encode, escapeRegExp, validateToken } from '../../scripts/github/api.js';
import { createRepository, getGitHubDirectoryContents, getGitHubFile, GitHubAPI, linkRepository } from '../../scripts/github/repository.js';
import { upload, uploadGitWith409Retry } from '../../scripts/github/uploader.js';

describe('GitHub Module: api.js', () => {
  it('should encode and decode string correctly', () => {
    const original = 'Hello World! 🚀 \n function test() { return 1+1; }';
    const encoded = encode(original);
    const decoded = decode(encoded);
    expect(decoded).toBe(original);
  });

  it('should escape regex special characters', () => {
    expect(escapeRegExp('Solution[1].js')).toBe('Solution\\[1\\]\\.js');
  });

  it('should validate token using GitHub user endpoint', async () => {
    spyOn(globalThis, 'fetch').and.returnValue(
      Promise.resolve({
        ok: true,
        json: async () => ({ login: 'testuser' }),
      })
    );

    const result = await validateToken('fake-token-123');
    expect(result).toEqual({ login: 'testuser' });
    expect(globalThis.fetch).toHaveBeenCalledWith('https://api.github.com/user', {
      headers: {
        Authorization: 'token fake-token-123',
        Accept: 'application/vnd.github.v3+json',
      },
    });
  });
});

describe('GitHub Module: repository.js', () => {
  it('should create repository correctly', async () => {
    spyOn(globalThis, 'fetch').and.returnValue(
      Promise.resolve({
        ok: true,
        status: 201,
        json: async () => ({
          name: 'algosync-solutions',
          full_name: 'testuser/algosync-solutions',
          html_url: 'https://github.com/testuser/algosync-solutions',
        }),
      })
    );

    const result = await createRepository('fake-token', 'algosync-solutions');
    expect(result.ok).toBeTrue();
    expect(result.status).toBe(201);
    expect(result.data.full_name).toBe('testuser/algosync-solutions');
  });

  it('should link/check repository correctly', async () => {
    spyOn(globalThis, 'fetch').and.returnValue(
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          name: 'algosync-solutions',
          full_name: 'testuser/algosync-solutions',
        }),
      })
    );

    const result = await linkRepository('fake-token', 'https://github.com/testuser/algosync-solutions');
    expect(result.ok).toBeTrue();
    expect(result.normalized).toBe('testuser/algosync-solutions');
    expect(result.data.full_name).toBe('testuser/algosync-solutions');
  });

  it('should export GitHubAPI object with createRepo and linkRepo aliases', () => {
    expect(typeof GitHubAPI.createRepo).toBe('function');
    expect(typeof GitHubAPI.linkRepo).toBe('function');
    expect(typeof GitHubAPI.validateToken).toBe('function');
    expect(typeof GitHubAPI.getGitHubFile).toBe('function');
    expect(typeof GitHubAPI.getGitHubDirectoryContents).toBe('function');
  });
});

describe('GitHub Module: uploader.js', () => {
  beforeEach(() => {
    const storageMock = {
      local: {
        get: jasmine.createSpy('get').and.callFake(keys => {
          if (keys === 'stats') {
            return Promise.resolve({ stats: { shas: {} } });
          }
          if (Array.isArray(keys)) {
            const result = {};
            if (keys.includes('leethub_token')) result.leethub_token = 'token-xyz';
            if (keys.includes('mode_type')) result.mode_type = 'commit';
            if (keys.includes('leethub_hook')) result.leethub_hook = 'testuser/repo';
            if (keys.includes('stats')) result.stats = { shas: {} };
            if (keys.includes('auto_sync_enabled')) result.auto_sync_enabled = true;
            if (keys.includes('auto_readme_enabled')) result.auto_readme_enabled = true;
            return Promise.resolve(result);
          }
          return Promise.resolve({});
        }),
        set: jasmine.createSpy('set').and.returnValue(Promise.resolve()),
      },
    };

    globalThis.chrome = {
      runtime: {
        sendMessage: (msg, callback) => {
          if (msg.type === 'GITHUB_API_REQUEST') {
            callback({
              ok: true,
              status: 200,
              body: { content: { sha: 'new-sha-789' } },
            });
          }
        },
      },
      storage: storageMock,
    };
  });

  afterEach(() => {
    delete globalThis.chrome;
  });

  it('should commit/upload file correctly and return SHA', async () => {
    const sha = await upload(
      'token-xyz',
      'testuser/repo',
      btoa('console.log(1)'),
      'LeetCode/0001-two-sum',
      'Solution.js',
      '',
      'Add Solution.js'
    );
    expect(sha).toBe('new-sha-789');
  });

  it('should uploadGitWith409Retry without error when authorized and repo defined', async () => {
    const sha = await uploadGitWith409Retry(
      btoa('console.log(1)'),
      'two-sum',
      'Solution.js',
      'Add Solution.js',
      {},
      'LeetCode'
    );
    expect(sha).toBe('new-sha-789');
  });
});
