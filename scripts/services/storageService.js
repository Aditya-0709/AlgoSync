/**
 * Storage Service
 * Responsible solely for chrome.storage interactions.
 * Never use chrome.storage directly outside this service.
 */
import { getBrowser } from '../utils/helpers.js';

const storageService = {
  async get(keys, callback) {
    const api = getBrowser();
    return new Promise(resolve => {
      try {
        if (!api || !api.storage || !api.storage.local) {
          if (callback) callback({});
          return resolve({});
        }
        let resolved = false;
        const handleResult = res => {
          if (resolved) return;
          resolved = true;
          const result = res || {};
          if (callback) callback(result);
          resolve(result);
        };

        const ret = api.storage.local.get(keys, handleResult);
        if (ret && typeof ret.then === 'function') {
          ret.then(handleResult).catch(() => handleResult({}));
        }
      } catch (err) {
        if (callback) callback({});
        resolve({});
      }
    });
  },

  async set(data, callback) {
    const api = getBrowser();
    return new Promise(resolve => {
      try {
        if (!api || !api.storage || !api.storage.local) {
          if (callback) callback();
          return resolve();
        }
        let resolved = false;
        const handleResult = () => {
          if (resolved) return;
          resolved = true;
          if (callback) callback();
          resolve();
        };

        const ret = api.storage.local.set(data, handleResult);
        if (ret && typeof ret.then === 'function') {
          ret.then(handleResult).catch(() => handleResult());
        }
      } catch (err) {
        if (callback) callback();
        resolve();
      }
    });
  },

  async remove(keys, callback) {
    const api = getBrowser();
    return new Promise(resolve => {
      try {
        if (!api || !api.storage || !api.storage.local) {
          if (callback) callback();
          return resolve();
        }
        let resolved = false;
        const handleResult = () => {
          if (resolved) return;
          resolved = true;
          if (callback) callback();
          resolve();
        };

        const ret = api.storage.local.remove(keys, handleResult);
        if (ret && typeof ret.then === 'function') {
          ret.then(handleResult).catch(() => handleResult());
        }
      } catch (err) {
        if (callback) callback();
        resolve();
      }
    });
  },

  async getSync(keys, callback) {
    const api = getBrowser();
    return new Promise(resolve => {
      try {
        if (!api || !api.storage) {
          if (callback) callback({});
          return resolve({});
        }
        const storageObj = api.storage.sync || api.storage.local;
        if (!storageObj) {
          if (callback) callback({});
          return resolve({});
        }
        let resolved = false;
        const handleResult = res => {
          if (resolved) return;
          resolved = true;
          const result = res || {};
          if (callback) callback(result);
          resolve(result);
        };

        const ret = storageObj.get(keys, handleResult);
        if (ret && typeof ret.then === 'function') {
          ret.then(handleResult).catch(() => handleResult({}));
        }
      } catch (err) {
        if (callback) callback({});
        resolve({});
      }
    });
  },

  async setSync(data, callback) {
    const api = getBrowser();
    return new Promise(resolve => {
      try {
        if (!api || !api.storage) {
          if (callback) callback();
          return resolve();
        }
        const storageObj = api.storage.sync || api.storage.local;
        if (!storageObj) {
          if (callback) callback();
          return resolve();
        }
        let resolved = false;
        const handleResult = () => {
          if (resolved) return;
          resolved = true;
          if (callback) callback();
          resolve();
        };

        const ret = storageObj.set(data, handleResult);
        if (ret && typeof ret.then === 'function') {
          ret.then(handleResult).catch(() => handleResult());
        }
      } catch (err) {
        if (callback) callback();
        resolve();
      }
    });
  },
};

export default storageService;
export { storageService };
