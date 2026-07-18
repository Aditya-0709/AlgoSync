import { storageService } from './services/storageService.js';

let api = isChrome() ? chrome : isFirefox() ? browser : undefined;

// const ONE_HOUR_MS = 60 * 60 * 1000;

api.runtime.onInstalled.addListener(details => {
  if (details.reason === 'install') {
    // Allow persistent stats to sync on repo link
    storageService.set({ sync_stats: true, solution_upload_mode: 'overwrite' });
  }
});

api.runtime.onMessage.addListener(handleMessage);

function handleMessage(request, sender, sendResponse) {
  if (request && request.closeWebPage === true && request.isSuccess === true) {
    /* Set username */
    storageService.set({ leethub_username: request.username });

    /* Set token */
    storageService.set({ leethub_token: request.token });

    /* Close pipe */
    storageService.set({ pipe_leethub: false }, () => {
      console.log('Closed pipe.');
    });

    api.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
      var tab = tabs[0];
      api.tabs.remove(tab.id);
    });

    /* Go to onboarding for UX */
    const urlOnboarding = api.runtime.getURL('welcome.html');
    api.tabs.create({ url: urlOnboarding, active: true }); // creates new tab
  } else if (request && request.closeWebPage === true && request.isSuccess === false) {
    alert('Something went wrong while trying to authenticate your profile!');
    api.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
      var tab = tabs[0];
      api.tabs.remove(tab.id);
    });
  } else if (request.type === 'LEETCODE_SUBMISSION') {
    const listener = function (details) {
      const match = details && details.url && details.url.match(/\/submissions\/(?:detail\/)?(\d+)/);
      if (match && match[1]) {
        sendResponse({ submissionId: match[1] });
        api.webNavigation.onHistoryStateUpdated.removeListener(listener);
      }
    };
    api.webNavigation.onHistoryStateUpdated.addListener(listener, {
      url: [{ hostSuffix: 'leetcode.com' }, { pathContains: 'submissions' }],
    });
    return true;
  } else if (request && request.type === 'GITHUB_API_REQUEST') {
    (async () => {
      try {
        const res = await fetch(request.url, request.options);
        const status = res.status;
        const ok = res.ok;
        const text = await res.text();
        let body;
        try {
          body = JSON.parse(text);
        } catch (_e) {
          body = text;
        }
        sendResponse({ success: true, status, ok, body });
      } catch (err) {
        sendResponse({ success: false, error: err.message || String(err) });
      }
    })();
    return true;
  }
  return true;
}

function isChrome() {
  return typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined';
}

function isFirefox() {
  return typeof browser !== 'undefined' && typeof browser.runtime !== 'undefined';
}
