import { storageService } from '../../scripts/services/storageService.js';
import { platformService } from '../../scripts/services/platformService.js';
import { syncService } from '../../scripts/services/syncService.js';
import { LeetCodeParser, LEETCODE_METADATA } from '../../scripts/parsers/leetcode/index.js';
import { GfgParser, GFG_METADATA } from '../../scripts/parsers/gfg/index.js';

describe('Service Layer Tests', () => {
  describe('storageService', () => {
    beforeEach(() => {
      const storageMock = {
        local: {
          get: jasmine.createSpy('get').and.callFake((keys, cb) => cb({ test_key: 'test_val' })),
          set: jasmine.createSpy('set').and.callFake((data, cb) => cb()),
          remove: jasmine.createSpy('remove').and.callFake((keys, cb) => cb()),
        },
        sync: {
          get: jasmine.createSpy('getSync').and.callFake((keys, cb) => cb({ sync_key: 'sync_val' })),
          set: jasmine.createSpy('setSync').and.callFake((data, cb) => cb()),
        },
      };
      globalThis.chrome = { runtime: {}, storage: storageMock };
    });

    afterEach(() => {
      delete globalThis.chrome;
    });

    it('should get data from storage.local', async () => {
      const res = await storageService.get(['test_key']);
      expect(res.test_key).toBe('test_val');
    });

    it('should set data to storage.local', async () => {
      await storageService.set({ new_key: 'new_val' });
      expect(globalThis.chrome.storage.local.set).toHaveBeenCalled();
    });

    it('should remove data from storage.local', async () => {
      await storageService.remove(['test_key']);
      expect(globalThis.chrome.storage.local.remove).toHaveBeenCalledWith(['test_key'], jasmine.any(Function));
    });

    it('should get data from storage.sync', async () => {
      const res = await storageService.getSync(['sync_key']);
      expect(res.sync_key).toBe('sync_val');
    });

    it('should set data to storage.sync', async () => {
      await storageService.setSync({ sync_key: 'sync_val_2' });
      expect(globalThis.chrome.storage.sync.set).toHaveBeenCalled();
    });
  });

  describe('platformService', () => {
    it('should return LeetCode parser and metadata for leetcode id', () => {
      expect(platformService.getParser('leetcode')).toBe(LeetCodeParser);
      expect(platformService.getMetadata('leetcode')).toBe(LEETCODE_METADATA);
    });

    it('should return GeeksForGeeks parser and metadata for geeksforgeeks id', () => {
      expect(platformService.getParser('geeksforgeeks')).toBe(GfgParser);
      expect(platformService.getMetadata('geeksforgeeks')).toBe(GFG_METADATA);
    });

    it('should return null for unknown platform id', () => {
      expect(platformService.getParser('unknown')).toBeNull();
      expect(platformService.getMetadata('unknown')).toBeNull();
    });
  });

  describe('syncService', () => {
    it('should have syncPlatformAndRootReadme and syncSubmission methods', () => {
      expect(typeof syncService.syncPlatformAndRootReadme).toBe('function');
      expect(typeof syncService.syncSubmission).toBe('function');
    });
  });
});
