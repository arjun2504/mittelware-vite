const updateDNR = async (rules: any) => {
  const dynamicRules = await browser.declarativeNetRequest.getDynamicRules();
  const updatedDnr = {
    removeRuleIds: dynamicRules.map((rule) => rule.id),
    addRules: rules
  };
  browser.declarativeNetRequest.updateDynamicRules(updatedDnr, () => {
    if (browser.runtime.lastError) {
      console.error('Failed to update rules: ', browser.runtime.lastError, rules);
    }
  });
}

const sendToMittelware = async (action: string) => {
  const tabs = await browser.tabs.query({ url: `${import.meta.env.VITE_HOST_URL}/*`});
  for (const tab of tabs) {
    if (tab.id) {
      browser.tabs.sendMessage(tab.id, {
        action,
      })
    }
  }
}

type RecordingStep = {
  type: 'navigate' | 'click' | 'type';
  description: string;
  screenshot?: string;
};

type RecordingSession = {
  tabId: number;
  webappTabId: number;
  url: string;
  steps: RecordingStep[];
  startedAt: string;
};

const captureScreenshot = async (windowId: number, immediate = false): Promise<string | undefined> => {
  if (!immediate) {
    // Give the page a moment to render the result of the last action.
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  try {
    return await browser.tabs.captureVisibleTab(windowId, { format: 'png' });
  } catch {
    // captureVisibleTab is rate-limited (~2 calls/sec) -- back off and retry once.
    await new Promise((resolve) => setTimeout(resolve, 1050));
    try {
      return await browser.tabs.captureVisibleTab(windowId, { format: 'png' });
    } catch (error) {
      console.error('Failed to capture recording screenshot', error);
      return undefined;
    }
  }
};

const appendRecordingStep = async (
  tabId: number,
  step: Omit<RecordingStep, 'screenshot'>,
  windowId?: number,
) => {
  // Prefer the windowId the caller already has (e.g. from sender.tab) to skip an
  // extra tabs.get() round-trip -- every bit of latency here matters for clicks,
  // since we're racing to capture before any resulting navigation starts.
  const resolvedWindowId = windowId ?? (await browser.tabs.get(tabId)).windowId;
  const screenshot = resolvedWindowId !== undefined
    ? await captureScreenshot(resolvedWindowId, step.type === 'click')
    : undefined;

  const { recordingSession } = await browser.storage.local.get('recordingSession');
  if (!recordingSession || recordingSession.tabId !== tabId) return; // recording was stopped meanwhile

  const updated: RecordingSession = {
    ...recordingSession,
    steps: [...recordingSession.steps, { ...step, screenshot }],
  };
  await browser.storage.local.set({ recordingSession: updated });
};

const injectRecorder = async (tabId: number) => {
  try {
    // registration: 'runtime' on recorder.content.ts means it's never statically
    // injected into every page -- only here, into the specific tab being recorded.
    await browser.scripting.executeScript({ target: { tabId }, files: ['content-scripts/recorder.js'] });
  } catch (error) {
    console.error('Failed to inject recorder script', error);
  }
};

const handleRecordingNavigation = async (tabId: number, url: string) => {
  const { recordingSession } = await browser.storage.local.get('recordingSession');
  if (!recordingSession || recordingSession.tabId !== tabId) return;

  // Only the very first navigation (starting the recording) gets its own step.
  // Later navigations are consequences of a click we already recorded, so a
  // second "Navigate to..." step for them is just noise.
  if (recordingSession.steps.length === 0) {
    let hostname = url;
    try {
      hostname = new URL(url).hostname;
    } catch {
      // keep raw url as fallback
    }
    await appendRecordingStep(tabId, { type: 'navigate', description: `Navigate to ${hostname}` });
  }

  // The recorder still needs re-injecting after every navigation (including
  // this first one) since the previous injection's JS context is destroyed by
  // the page load.
  await injectRecorder(tabId);
};

const stopRecording = async () => {
  console.log('[mittelware] stopRecording: received stop request');
  const { recordingSession } = await browser.storage.local.get('recordingSession');
  if (!recordingSession) {
    console.log('[mittelware] stopRecording: no active recordingSession found in storage');
    return;
  }

  try {
    await Promise.race([
      browser.tabs.sendMessage(recordingSession.tabId, { action: 'mittelware:recording:stop' }),
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ]);
  } catch (error) {
    console.error('[mittelware] stopRecording: failed to message recording tab (non-fatal)', error);
  }

  await browser.storage.local.set({
    recordingDraft: {
      id: crypto.randomUUID(),
      url: recordingSession.url,
      steps: recordingSession.steps,
      startedAt: recordingSession.startedAt,
      stoppedAt: new Date().toISOString(),
    },
  });
  await browser.storage.local.remove('recordingSession');
  console.log('[mittelware] stopRecording: draft saved, steps:', recordingSession.steps.length);

  try {
    await browser.tabs.remove(recordingSession.tabId);
  } catch (error) {
    console.error('[mittelware] stopRecording: failed to close recording tab (non-fatal)', error);
  }

  try {
    const webappTab = await browser.tabs.update(recordingSession.webappTabId, {
      active: true,
      url: `${import.meta.env.VITE_HOST_URL}/recordings/review`,
    });
    if (webappTab?.windowId !== undefined) {
      await browser.windows.update(webappTab.windowId, { focused: true });
    }
    console.log('[mittelware] stopRecording: refocused webapp tab', recordingSession.webappTabId);
  } catch (error) {
    console.error('[mittelware] stopRecording: failed to refocus webapp tab', error);
  }

  try {
    // sidePanel.close() isn't broadly supported yet. We opened the panel as the
    // window's default (no tabId), so it must be closed the same way -- disabling
    // a *different* scope (e.g. a tabId-specific override) won't affect it.
    await browser.sidePanel.setOptions({ enabled: false });
    console.log('[mittelware] stopRecording: closed side panel');
  } catch (error) {
    console.error('[mittelware] stopRecording: failed to close side panel', error);
  }
};

const beginRecording = async (url: string, webappTabId: number) => {
  const newTab = await browser.tabs.create({ url });
  if (!newTab.id) return;

  const session: RecordingSession = {
    tabId: newTab.id,
    webappTabId,
    url,
    steps: [],
    startedAt: new Date().toISOString(),
  };
  await browser.storage.local.set({ recordingSession: session });
};

const handleRuntimeMessage = async (message: any, sender: any) => {
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
      appendRecordingStep(sender.tab.id, message.payload, sender.tab.windowId);
    }
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

    browser.webNavigation.onCommitted.addListener((details) => {
      if (details.frameId !== 0) return;
      handleRecordingNavigation(details.tabId, details.url);
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
