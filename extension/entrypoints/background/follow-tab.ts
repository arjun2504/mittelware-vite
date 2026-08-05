import type { RecordingSession } from './recording-types';
import { enqueueRecordingSessionTask } from './recording-queue';
import { isBlankTabUrl } from './navigation-tracking';
import { injectRecorder, pauseRecorder } from './recorder-tab';
import { settleTrackedTabStart } from './settle-navigation';

// Only follow an opener-less tab if it appeared shortly after a step we just
// recorded -- bounds the rel="noopener" fallback below so we don't hijack an
// unrelated tab the user happens to open later in the session.
const RECENT_STEP_WINDOW_MS = 3000;
const FOLLOW_CHILD_TAB_BLANK_URL_DELAY_MS = 120;

const refreshTabIfNeeded = async (tab: {
  id?: number;
  openerTabId?: number;
  url?: string;
  pendingUrl?: string;
  windowId?: number;
}) => {
  if (tab.openerTabId !== undefined) return tab;
  const destination = tab.pendingUrl || tab.url || '';
  if (!isBlankTabUrl(destination)) return tab;
  await new Promise((resolve) => setTimeout(resolve, FOLLOW_CHILD_TAB_BLANK_URL_DELAY_MS));
  if (tab.id === undefined) return tab;
  return browser.tabs.get(tab.id).catch(() => tab);
};

const waitForRecordingStepUpdate = async (startedAt: string, oldLastStepAt: string) => {
  const deadline = Date.now() + 200;
  while (Date.now() <= deadline) {
    const { recordingSession } = await browser.storage.local.get('recordingSession');
    if (!recordingSession || recordingSession.startedAt !== startedAt) return undefined;
    if (recordingSession.lastStepAt !== oldLastStepAt) return recordingSession;
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
  const { recordingSession } = await browser.storage.local.get('recordingSession');
  if (!recordingSession || recordingSession.startedAt !== startedAt) return undefined;
  return recordingSession;
};

// Fires when the tracked recording tab opens a new tab (e.g. a link with
// target="_blank", or a window.open() popup). Without this, navigating away
// in a new tab silently orphans the recording -- the extension keeps watching
// the old tab while the user interacts with a completely untracked one.
export const followChildTab = async (tab: {
  id?: number;
  openerTabId?: number;
  url?: string;
  pendingUrl?: string;
  windowId?: number;
}) => {
  console.log('[mittelware] tabs.onCreated', {
    id: tab.id,
    openerTabId: tab.openerTabId,
    windowId: tab.windowId,
    url: tab.url,
    pendingUrl: tab.pendingUrl,
  });

  if (tab.id === undefined) return;
  const tabId = tab.id;

  // The whole decide-then-write sequence runs as one queued task (see
  // enqueueRecordingSessionTask) -- not just the final write -- so the
  // decision itself (e.g. "was the last step recent enough") is also made
  // against a storage snapshot that can't be invalidated by another queued
  // mutation landing in between it and the write below.
  const oldTabId = await enqueueRecordingSessionTask(async (): Promise<number | undefined> => {
    let { recordingSession } = await browser.storage.local.get('recordingSession');
    if (!recordingSession) {
      console.log('[mittelware] followChildTab: no active recording, ignoring');
      return undefined;
    }
    if (recordingSession.tabId === tabId) {
      console.log('[mittelware] followChildTab: new tab is already the tracked tab, ignoring');
      return undefined;
    }

    const openedByTrackedTab = tab.openerTabId === recordingSession.tabId;
    if (!openedByTrackedTab) {
      if (tab.openerTabId !== undefined) {
        console.log(
          '[mittelware] followChildTab: opener is a different tab, ignoring',
          { openerTabId: tab.openerTabId, trackedTabId: recordingSession.tabId },
        );
        return undefined;
      }

      tab = await refreshTabIfNeeded(tab);

      const updatedSession = await waitForRecordingStepUpdate(recordingSession.startedAt, recordingSession.lastStepAt);
      if (!updatedSession) {
        console.log('[mittelware] followChildTab: recording session no longer valid while waiting for step update');
        return undefined;
      }
      recordingSession = updatedSession;
    }

    if (!openedByTrackedTab) {
      const destination = tab.pendingUrl || tab.url || '';
      if (isBlankTabUrl(destination)) {
        console.log('[mittelware] followChildTab: no openerTabId and blank destination, ignoring', { destination });
        return undefined;
      }
      const lastStepAt = new Date(recordingSession.lastStepAt).getTime();
      const msSinceLastStep = Date.now() - lastStepAt;
      if (msSinceLastStep > RECENT_STEP_WINDOW_MS) {
        console.log(
          '[mittelware] followChildTab: no openerTabId and too long since last step, ignoring',
          { msSinceLastStep, destination },
        );
        return undefined;
      }
      console.log('[mittelware] followChildTab: following via noopener fallback heuristic', { destination, msSinceLastStep });
    } else {
      console.log('[mittelware] followChildTab: following via openerTabId match');
    }

    const updated: RecordingSession = {
      ...recordingSession,
      previousTabId: recordingSession.tabId,
      tabId,
      awaitingNavigationStep: true,
      knownTabIds: recordingSession.knownTabIds.includes(tabId)
        ? recordingSession.knownTabIds
        : [...recordingSession.knownTabIds, tabId],
    };
    await browser.storage.local.set({ recordingSession: updated });
    console.log('[mittelware] followChildTab: now tracking tab', tabId, '(was', recordingSession.tabId, ')');
    return recordingSession.tabId;
  });

  if (oldTabId === undefined) return;

  // Stop the old tab from listening -- see pauseRecorder's comment.
  pauseRecorder(oldTabId);

  // Don't just set the flag and hope webNavigation.onCommitted fires for
  // this tab afterwards -- it may already have fired (and been ignored,
  // since the tab wasn't tracked yet) before this write landed. Settle it
  // directly; see settleTrackedTabStart for why this is safe to race.
  await settleTrackedTabStart(tabId, tab.url || tab.pendingUrl);
};

// If a followed child tab (see `followChildTab`) closes itself -- e.g. a
// popup that finishes an OAuth flow and calls window.close() -- hop tracking
// back to the tab we were on before following it, instead of going dark.
export const handleTrackedTabRemoved = async (tabId: number) => {
  console.log('[mittelware] tabs.onRemoved', tabId);

  const hoppedBackTo = await enqueueRecordingSessionTask(async (): Promise<number | undefined> => {
    const { recordingSession } = await browser.storage.local.get('recordingSession');
    if (!recordingSession || recordingSession.tabId !== tabId) return undefined;
    if (recordingSession.previousTabId === undefined) return undefined;

    const previousTabId = recordingSession.previousTabId;
    const previousTabStillOpen = await browser.tabs.get(previousTabId).catch(() => undefined);
    if (!previousTabStillOpen) return undefined;
    console.log('[mittelware] handleTrackedTabRemoved: hopping back to previous tab', previousTabId);

    await browser.storage.local.set({
      recordingSession: {
        ...recordingSession,
        tabId: previousTabId,
        previousTabId: undefined,
        // We're resuming a tab already mid-flow, not landing on a fresh nav,
        // so this doesn't go through settleTrackedTabStart's "Navigate to..."
        // step.
        awaitingNavigationStep: false,
      },
    });
    return previousTabId;
  });

  if (hoppedBackTo === undefined) return;
  // followChildTab paused this tab's recorder (see pauseRecorder) when we
  // originally hopped away from it, so it needs a fresh injection to have
  // listeners again -- resuming tracking here doesn't undo that by itself.
  await injectRecorder(hoppedBackTo);
};

// Fires whenever the user switches focus to a different tab. If that tab is
// part of this recording's lineage (knownTabIds -- the initial tab, or one
// followChildTab has ever hopped into) but isn't the one currently tracked,
// the user has manually switched back to continue the flow there (e.g. they
// followed a link in a new tab, then clicked back to the original tab to
// keep going) -- move tracking to follow them. A tab that was never part of
// this recording (e.g. the user just checking email mid-session) is left
// alone; only "continued from" tabs move tracking, never arbitrary ones.
export const handleTabActivated = async (tabId: number) => {
  const hop = await enqueueRecordingSessionTask(async (): Promise<{ from: number; to: number } | undefined> => {
    const { recordingSession } = await browser.storage.local.get('recordingSession');
    if (!recordingSession || recordingSession.tabId === tabId) return undefined;
    if (!recordingSession.knownTabIds.includes(tabId)) return undefined;

    const fromTabId = recordingSession.tabId;
    console.log('[mittelware] handleTabActivated: user switched to known tab', tabId, '-- moving tracking from', fromTabId);
    await browser.storage.local.set({
      recordingSession: {
        ...recordingSession,
        previousTabId: fromTabId,
        tabId,
        // Resuming a tab we've tracked before, not landing on a fresh
        // navigation -- no "Navigate to..." step here.
        awaitingNavigationStep: false,
      },
    });
    return { from: fromTabId, to: tabId };
  });

  if (!hop) return;
  // The now-unfocused tab's recorder stays live until told otherwise (see
  // pauseRecorder), and the newly-focused one needs re-injecting since
  // followChildTab paused it back when tracking first moved away.
  pauseRecorder(hop.from);
  await injectRecorder(hop.to);
};
