import type { RecordingStep } from './recording-types';
import { updateRecordingSession } from './recording-queue';

export const captureScreenshot = async (windowId: number, delayMs = 300): Promise<string | undefined> => {
  if (delayMs > 0) {
    // Give the page a moment to render the result of the last action.
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  // JPEG encodes noticeably faster than PNG for a full-tab capture -- for
  // click steps (delay=0) we're racing the click's own default action (e.g.
  // a same-tab navigation), so shaving encode time shrinks the window where
  // that navigation can start before the capture actually runs and we end up
  // with a screenshot of a blank/half-unloaded page.
  const options = { format: 'jpeg', quality: 85 } as const;
  try {
    return await browser.tabs.captureVisibleTab(windowId, options);
  } catch {
    // captureVisibleTab is rate-limited (~2 calls/sec) -- back off and retry once.
    await new Promise((resolve) => setTimeout(resolve, 1050));
    try {
      return await browser.tabs.captureVisibleTab(windowId, options);
    } catch (error) {
      console.error('Failed to capture recording screenshot', error);
      return undefined;
    }
  }
};

export const appendRecordingStep = async (
  tabId: number,
  step: Omit<RecordingStep, 'screenshot'>,
  windowId?: number,
  screenshotDelayMs?: number,
  // Identifies the recording session this step belongs to (recordingSession's
  // startedAt, captured by the caller before the async screenshot capture
  // below). A click that opens a new tab can have followChildTab hop
  // recordingSession.tabId to that child tab *while this function is still
  // awaiting captureScreenshot* -- if we then gated on "is tabId still the
  // tracked tab", this step (the very click that caused the hop) would look
  // stale and get silently dropped. Gating on session identity instead means
  // it's only dropped if the recording actually stopped/restarted meanwhile.
  // Callers that don't pass this (e.g. navigate steps) keep the stricter
  // tabId-based check.
  expectedStartedAt?: string,
) => {
  // Prefer the windowId the caller already has (e.g. from sender.tab) to skip an
  // extra tabs.get() round-trip -- every bit of latency here matters for clicks,
  // since we're racing to capture before any resulting navigation starts.
  const resolvedWindowId = windowId ?? (await browser.tabs.get(tabId)).windowId;
  const delay = screenshotDelayMs ?? (step.type === 'click' ? 0 : 300);
  const screenshot = resolvedWindowId !== undefined
    ? await captureScreenshot(resolvedWindowId, delay)
    : undefined;

  await updateRecordingSession((session) => {
    const isStale = expectedStartedAt !== undefined
      ? session.startedAt !== expectedStartedAt
      : session.tabId !== tabId;
    if (isStale) return undefined;
    return {
      ...session,
      steps: [...session.steps, { ...step, screenshot }],
      lastStepAt: new Date().toISOString(),
    };
  });
};

export const injectRecorder = async (tabId: number, frameId?: number) => {
  try {
    // registration: 'runtime' on recorder.content.ts means it's never statically
    // injected into every page -- only here, into the specific tab (or frame)
    // being recorded.
    const target = frameId === undefined
      ? { tabId, allFrames: true }
      : { tabId, frameIds: [frameId] };

    // Try injecting and verify the content script actually loaded by pinging
    // it. Some pages (heavy SPAs) replace the document or delay execution
    // such that the injected script misses initialization; retry a few
    // times with short backoff when that happens.
    const MAX_RETRIES = 3;
    let lastError: unknown = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const result = await browser.scripting.executeScript({ target, files: ['content-scripts/recorder.js'], injectImmediately: true });
        console.log('[mittelware] injectRecorder: executeScript result', { tabId, frameId, attempt, result });
        // First try a frame-level verification: some sites (e.g. FB) may
        // cause the injected script to land in a child frame rather than
        // the top frame, so `tabs.sendMessage` to the tab might miss it.
        // `scripting.executeScript` with a small function runs in each
        // injected frame and can check the per-frame window state.
        try {
          const verify = await browser.scripting.executeScript({
            target,
            func: () => {
              try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return Boolean((window as any).__mittelwareRecorderInitialized);
              } catch {
                return false;
              }
            },
          });
          const initialized = Array.isArray(verify) && verify.some((r) => (r as any)?.result === true);
          if (initialized) {
            console.log('[mittelware] injectRecorder: content script reported initialized via frame-check', { tabId, attempt });
            break;
          }

          // Fallback to the existing runtime message ping in case the
          // frame-check didn't observe the flag (older content script
          // shapes or timing reasons).
          await Promise.race([
            browser.tabs.sendMessage(tabId, { action: 'mittelware:recording:ping' }),
            new Promise((_, rej) => setTimeout(() => rej(new Error('ping-timeout')), 300)),
          ]);
          console.log('[mittelware] injectRecorder: content script responded to ping', { tabId, attempt });
          break; // success
        } catch (pingErr) {
          lastError = pingErr;
          console.warn('[mittelware] injectRecorder: verification failed after executeScript, will retry', { tabId, attempt, pingErr });
          // small backoff before retrying injection
          await new Promise((res) => setTimeout(res, 250));
          continue;
        }
      } catch (err) {
        lastError = err;
        console.error('[mittelware] injectRecorder: executeScript failed, will retry', { tabId, frameId, attempt, err });
        await new Promise((res) => setTimeout(res, 250));
      }
    }
    if (lastError) {
      console.error('[mittelware] injectRecorder: final error after retries', { tabId, frameId, lastError });
    } else {
      console.log('[mittelware] injectRecorder: injection complete', { tabId, frameId });
    }
  } catch (error) {
    console.error('[mittelware] injectRecorder: failed for tab', tabId, frameId, error);
  }
};

// Tells a tab's content script (if any) to stop listening for clicks/
// keydowns -- reuses the same message stopRecording sends when ending the
// whole session, but here it only detaches this one tab's listeners without
// touching any session state. Used when tracking hops away from a tab (see
// follow-tab.ts) so it can't keep sending steps for clicks the user makes
// there after tracking has moved on -- without this, appendRecordingStep's
// click/type staleness check (session-identity based, not tab-id based; see
// its comment) would happily keep accepting them, making an untracked old
// tab look like it's still "recording".
export const pauseRecorder = async (tabId: number) => {
  try {
    await browser.tabs.sendMessage(tabId, { action: 'mittelware:recording:stop' });
  } catch {
    // tab may have no content script injected (e.g. a chrome:// page) or
    // already be closing -- fine either way, nothing to pause.
  }
};

// Stamps lastStepAt immediately when a click/type is reported, before the
// (up to ~1.4s, with retry-on-rate-limit) screenshot capture in
// appendRecordingStep completes. followChildTab's rel="noopener" fallback
// gates on lastStepAt being recent -- without this, a new tab spawned by a
// click can appear *before* that click's own step has finished being
// recorded, so the gate would still be comparing against the *previous*
// step's (possibly stale, >3s old) timestamp and wrongly refuse to follow.
// Returns the session's startedAt (a stable ID across tab-follow hops) so the
// caller can pass it to appendRecordingStep -- see the comment there.
export const markStepInProgress = async (tabId: number): Promise<string | undefined> => {
  const updated = await updateRecordingSession((session) => {
    // Only bump the timestamp if this is still the actively tracked tab --
    // if tracking already hopped to a child tab (see followChildTab), leave
    // its more relevant, more recent stamp alone.
    if (session.tabId !== tabId) return undefined;
    return {
      ...session,
      lastStepAt: new Date().toISOString(),
    };
  });
  return updated?.startedAt;
};

export const clearAwaitingNavigationFlag = async (tabId: number) => {
  await updateRecordingSession((session) => {
    if (session.tabId !== tabId) return undefined; // session moved on meanwhile
    return { ...session, awaitingNavigationStep: false };
  });
};
