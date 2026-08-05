import type { RecordingSession } from './recording-types';
import { SPA_SETTLE_DELAY_MS, committedNavigation, completedNavigation, forgetTabNavigations } from './navigation-tracking';
import { appendRecordingStep, clearAwaitingNavigationFlag, injectRecorder } from './recorder-tab';

// Tabs currently being settled by settleTrackedTabStart (see below) --
// claimed synchronously (no await before the add) so two racing callers for
// the same tab can never both proceed, however their subsequent awaits
// happen to interleave.
const settlingTabs = new Set<number>();

// Handles a newly-tracked tab's first navigation: injects the recorder as
// soon as the navigation commits, then separately records a "Navigate to..."
// step (screenshot + description) once the page actually finishes loading,
// and clears awaitingNavigationStep.
//
// This is deliberately callable from more than one place -- webNavigation.
// onCommitted (the normal path, via handleRecordingNavigation) AND
// followChildTab/beginRecording, called directly right after they start
// tracking a tab. Chrome gives no ordering guarantee between tabs.onCreated
// and webNavigation.onCommitted for a brand new tab: if onCommitted happens
// to fire *before* the tab is marked as tracked, handleRecordingNavigation
// ignores it (untracked tab) -- and since onCommitted only fires once per
// navigation, nothing would otherwise ever run this step or inject the
// recorder into that tab, silently killing the recording for it. Having the
// tracker itself call this directly closes that gap regardless of which
// side of the race wins.
//
// Injection is gated on the navigation *committing* (fast, near-instant --
// see committedNavigation in navigation-tracking.ts), not on it *completing*
// (which can take seconds on a heavy page). Gating injection on full page
// load was the cause of a real bug: if the user clicked something in the
// new tab before the full-load wait finished, nothing was listening yet, so
// the click was missed entirely -- and since the OLD tab's recorder
// listeners are still live (nothing ever detaches them just because
// tracking moved on), a click there in the meantime would still get
// recorded, making it look like the new tab simply never records.
//
// Double-calling is expected, but must never double-inject the recorder --
// injecting it twice into the same still-live page (no navigation in
// between to reset the JS realm) registers a second set of click/keydown
// listeners, so every subsequent click gets recorded 2-3x. Re-reading
// awaitingNavigationStep from storage right before acting is NOT enough to
// prevent that: both racing callers can call committedNavigation.wait for
// the same tab, both resolve around the same tick, and both can read the
// flag as still true before either has written it false. The settlingTabs claim
// above closes that gap: it's plain synchronous Set mutation with no await
// in between check-and-claim, so whichever caller's synchronous prologue
// runs first (guaranteed exclusive, since this is a single JS thread) wins
// outright, before either one's async work even starts.
// 'handled': this call did the settle work (inject + append step).
// 'not-applicable': it wasn't this tab's first navigation to begin with --
//   caller should still inject on its own, since nothing else will.
// 'blocked': another caller is *currently* settling this exact tab. That
//   caller owns the injection for this navigation, whatever it decides --
//   the blocked caller must NOT also inject, or it's the same double-inject
//   bug through a different door.
export type SettleResult = 'handled' | 'not-applicable' | 'blocked';

export const settleTrackedTabStart = async (tabId: number, knownUrl?: string): Promise<SettleResult> => {
  if (settlingTabs.has(tabId)) return 'blocked';
  settlingTabs.add(tabId);
  try {
    const { recordingSession: before } = await browser.storage.local.get('recordingSession');
    if (!before || before.tabId !== tabId || !before.awaitingNavigationStep) return 'not-applicable';

    // Wait only for the navigation to commit, not to finish loading -- see
    // the comment above for why this needs to be fast.
    const committedUrl = await committedNavigation.wait(tabId);

    const { recordingSession: mid } = await browser.storage.local.get('recordingSession');
    if (!mid || mid.tabId !== tabId || !mid.awaitingNavigationStep) return 'not-applicable';

    // Attach listeners right away -- the "Navigate to..." step capture below
    // can take its time without costing us any clicks.
    await injectRecorder(tabId);
    await recordNavigateStep(tabId, mid, committedUrl ?? knownUrl);
    return 'handled';
  } finally {
    settlingTabs.delete(tabId);
  }
};

const recordNavigateStep = async (
  tabId: number,
  recordingSession: RecordingSession,
  knownUrl?: string,
): Promise<void> => {
  // onCommitted fires as soon as navigation starts -- long before an SPA has
  // rendered anything. Wait for the tab to actually finish loading (plus a
  // short settle delay for client-side rendering) before capturing, so the
  // step doesn't just show a blank page. The resolved URL (the real,
  // post-redirect destination) is preferred over knownUrl below.
  const completedUrl = await completedNavigation.wait(tabId);
  forgetTabNavigations(tabId);

  let hostname = completedUrl ?? knownUrl;
  if (!hostname) {
    try {
      hostname = (await browser.tabs.get(tabId)).url;
    } catch {
      // tab may already be gone
    }
  }
  try {
    if (hostname) hostname = new URL(hostname).hostname;
  } catch {
    // keep raw url as fallback
  }

  // Step 1 of the recording is a deliberate "go to this URL" starting point,
  // but every later navigate step is really just describing where the
  // previous click led -- phrase it as a consequence, not an instruction.
  const description = `Navigate to ${hostname}`;
  if (recordingSession.steps.length === 0) {
    await appendRecordingStep(
      tabId,
      { type: 'navigate', description },
      undefined,
      SPA_SETTLE_DELAY_MS,
    );
  }
  await clearAwaitingNavigationFlag(tabId);
};

export const handleRecordingNavigation = async (tabId: number, url: string) => {
  const { recordingSession } = await browser.storage.local.get('recordingSession');
  if (!recordingSession || recordingSession.tabId !== tabId) {
    console.log('[mittelware] handleRecordingNavigation: ignoring commit for untracked tab', tabId, url);
    return;
  }
  console.log('[mittelware] handleRecordingNavigation: commit for tracked tab', tabId, url, 'awaitingNavigationStep=', recordingSession.awaitingNavigationStep);

  const result = await settleTrackedTabStart(tabId, url);
  if (result === 'not-applicable') {
    // Genuinely not this tab's first navigation -- still need a fresh
    // injection since the page's JS context was just destroyed by this commit.
    await injectRecorder(tabId);
  }
  // 'handled': settleTrackedTabStart already injected.
  // 'blocked': the racing followChildTab/beginRecording call owns injection
  // for this navigation -- injecting here too would double it up.
};
