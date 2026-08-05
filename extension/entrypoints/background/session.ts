import type { RecordingSession } from './recording-types';
import { enqueueRecordingSessionTask } from './recording-queue';
import { settleTrackedTabStart } from './settle-navigation';

export const stopRecording = async () => {
  console.log('[mittelware] stopRecording: received stop request');

  // Queued so this can't race an in-flight step-append (e.g. the last click
  // before stopping) -- either it's already landed by the time this task
  // gets its turn (steps includes it) or it hasn't been queued yet and will
  // simply see recordingSession gone and no-op (see updateRecordingSession).
  const recordingSession = await enqueueRecordingSessionTask(async (): Promise<RecordingSession | undefined> => {
    const { recordingSession } = await browser.storage.local.get('recordingSession');
    if (!recordingSession) return undefined;

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
    return recordingSession;
  });

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

export const beginRecording = async (url: string, webappTabId: number) => {
  const newTab = await browser.tabs.create({ url });
  if (!newTab.id) return;
  const tabId = newTab.id;

  const startedAt = new Date().toISOString();
  const session: RecordingSession = {
    tabId,
    webappTabId,
    url,
    steps: [],
    startedAt,
    awaitingNavigationStep: true,
    lastStepAt: startedAt,
    knownTabIds: [tabId],
  };
  // Queued (not a bare set()) so this can't race a leftover task from a
  // just-stopped previous session still finishing up -- see
  // enqueueRecordingSessionTask.
  await enqueueRecordingSessionTask(async () => {
    await browser.storage.local.set({ recordingSession: session });
  });

  // tabs.create() already starts the tab navigating to `url` as a side
  // effect, so its webNavigation.onCommitted can fire before this write even
  // lands -- same race as followChildTab, see settleTrackedTabStart.
  await settleTrackedTabStart(tabId, url);
};
