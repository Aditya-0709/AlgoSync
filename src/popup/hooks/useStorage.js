import { useState, useEffect, useCallback } from 'react';

const getBrowser = () => {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return chrome;
  }
  if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
    return browser;
  }
  return null;
};

export const api = getBrowser();

export function useStorage(key, defaultValue) {
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!api) {
      setLoading(false);
      return;
    }

    api.storage.local.get([key], (result) => {
      if (result && result[key] !== undefined) {
        setValue(result[key]);
      } else {
        setValue(defaultValue);
      }
      setLoading(false);
    });

    const handleStorageChange = (changes, areaName) => {
      if (areaName === 'local' && changes[key] !== undefined) {
        setValue(changes[key].newValue !== undefined ? changes[key].newValue : defaultValue);
      }
    };

    if (api.storage.onChanged) {
      api.storage.onChanged.addListener(handleStorageChange);
    }

    return () => {
      if (api.storage.onChanged) {
        api.storage.onChanged.removeListener(handleStorageChange);
      }
    };
  }, [key]);

  const setStorageValue = useCallback((newValue) => {
    setValue(newValue);
    if (!api) return Promise.resolve();
    return new Promise((resolve) => {
      api.storage.local.set({ [key]: newValue }, () => {
        resolve();
      });
    });
  }, [key]);

  return [value, setStorageValue, loading];
}

export async function getStorageMultiple(keys) {
  if (!api) return {};
  return new Promise((resolve) => {
    api.storage.local.get(keys, resolve);
  });
}

export async function setStorageMultiple(data) {
  if (!api) return Promise.resolve();
  return new Promise((resolve) => {
    api.storage.local.set(data, resolve);
  });
}
