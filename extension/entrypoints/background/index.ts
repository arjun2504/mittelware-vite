import { updateDNR, sendToMittelware } from './dnr';
import { committedNavigation, completedNavigation, forgetTabNavigations } from './navigation-tracking';
import { appendRecordingStep, injectRecorder, markStepInProgress } from './recorder-tab';
import { handleRecordingNavigation } from './settle-navigation';
import { followChildTab, handleTrackedTabRemoved, handleTabActivated } from './follow-tab';
import { beginRecording, stopRecording } from './session';

const handleRuntimeMessage = async (message: any, sender: any) => {
  console.log('[mittelware] runtime message received', {
    action: message?.action,
    payload: message?.payload,
    tabId: sender?.tab?.id,
    tabUrl: sender?.tab?.url,
    frameId: sender?.frameId,
  });
  const { settings, rules } = await browser.storage.local.get(['settings', 'rules']);
  if (message.action === 'mittelware:rules:sync') {
    const { rules: newRules } = message.payload;
    await browser.storage.local.set({ rules: newRules }); // update local storage

    if (!settings.isPaused) {
      updateDNR(newRules);
    }
  } else if (message.action === 'mittelware:rules:sync:pause') {
    updateDNR(settings.isPaused ? [] : rules);
    sendToMittelware('mittelware:intercept:pong');
  } else if (message.action === 'mittelware:intercept:ping') {
    sendToMittelware('mittelware:intercept:pong');
  } else if (message.action === 'mittelware:recording:begin') {
    const { url } = message.payload || {};
    if (url && sender.tab?.id) {
      beginRecording(url, sender.tab.id);
    }
  } else if (message.action === 'mittelware:recording:step') {
    if (sender.tab?.id) {
      console.log('[mittelware] recording step message', {
        tabId: sender.tab.id,
        windowId: sender.tab.windowId,
        payload: message.payload,
      });
      const tabId = sender.tab.id;
      const windowId = sender.tab.windowId;
      markStepInProgress(tabId).then((expectedStartedAt) =>
        appendRecordingStep(tabId, message.payload, windowId, undefined, expectedStartedAt),
      );
    }
  } else if (message.action === 'mittelware:recording:content-loaded') {
    console.log('[mittelware] recorder content script loaded', {
      tabId: sender?.tab?.id,
      tabUrl: sender?.tab?.url,
      payload: message.payload,
    });
  } else if (message.action === 'mittelware:recording:stop') {
    stopRecording().catch((error) => console.error('[mittelware] stopRecording failed', error));
  } else if (message.action === 'mittelware:recording:draft:clear') {
    browser.storage.local.remove('recordingDraft');
  }
};

export default defineBackground({
  persistent: true,
  main() {
    // NOTE: this listener must stay synchronous (no `async`, no await before
    // sidePanel.open()) for the 'mittelware:recording:begin' branch. Chrome only
    // allows chrome.sidePanel.open() to be called within the same task as the
    // user gesture that triggered this message -- any `await` beforehand (even
    // an unrelated one) loses that window and the call silently fails.
    browser.runtime.onMessage.addListener((message, sender) => {
      if (message.action === 'mittelware:recording:begin' && sender.tab?.windowId !== undefined) {
        // Re-enable the default panel (stopRecording disables it after each
        // session) and open it, both fired synchronously so open() stays inside
        // the user gesture window.
        browser.sidePanel.setOptions({ enabled: true, path: 'sidepanel.html' }).catch(() => {});
        browser.sidePanel.open({ windowId: sender.tab.windowId }).catch((error) => {
          console.error('Failed to open side panel for recording', error);
        });
      }

      handleRuntimeMessage(message, sender);
    });

    // Feeds completedNavigation (see its comment) -- unconditional for every
    // tab, tracked or not, so a race with followChildTab/beginRecording
    // marking a tab tracked can never make us miss the signal.
    browser.webNavigation.onCompleted.addListener((details) => {
      if (details.frameId !== 0) return;
      completedNavigation.resolve(details.tabId, details.url);
    });

    browser.webNavigation.onCommitted.addListener(async (details) => {
      if (details.frameId === 0) {
        // Feeds committedNavigation (see its comment) -- same "unconditional,
        // tracked or not" reasoning as onCompleted above.
        committedNavigation.resolve(details.tabId, details.url);
        handleRecordingNavigation(details.tabId, details.url);
        return;
      }

      // A sub-frame (iframe) navigated. It didn't exist yet when we injected
      // into the main frame, so it needs its own injection to have clicks
      // inside it captured -- every frame gets its own onCommitted event as it
      // loads, regardless of when that happens relative to the main page.
      const { recordingSession } = await browser.storage.local.get('recordingSession');
      if (!recordingSession || recordingSession.tabId !== details.tabId) return;
      await injectRecorder(details.tabId, details.frameId);
    });

    browser.tabs.onCreated.addListener((tab) => {
      followChildTab(tab).catch((error) =>
        console.error('[mittelware] failed to follow child tab', error),
      );
    });

    browser.tabs.onActivated.addListener((activeInfo) => {
      handleTabActivated(activeInfo.tabId).catch((error) =>
        console.error('[mittelware] failed to handle tab activation', error),
      );
    });

    browser.tabs.onRemoved.addListener((tabId) => {
      forgetTabNavigations(tabId);
      handleTrackedTabRemoved(tabId).catch((error) =>
        console.error('[mittelware] failed to handle removed tab', error),
      );
    });

    browser.runtime.onInstalled.addListener((details) => {
      if (details.reason !== 'install') return;

      browser.storage.local.set({
        settings: {
          isPaused: false,
        }
      });
      browser.tabs.create({ url: import.meta.env.VITE_HOST_URL });
    });
  }
});
