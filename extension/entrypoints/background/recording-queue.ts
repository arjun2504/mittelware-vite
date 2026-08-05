import type { RecordingSession } from './recording-types';

// Serializes every read-modify-write of `recordingSession` (append a step,
// hop tracking to a new tab, clear a flag, stop the session, ...) behind a
// single chained promise. browser.storage.local has no atomic read-modify-
// write, and several independent async chains legitimately race on this
// key -- e.g. a click's screenshot capture (tens of ms) racing against the
// followChildTab hop that same click's new tab triggers. Without this,
// whichever finishes its own get()...set() cycle last silently clobbers the
// other's change (a lost update on the *whole* object, since each writer
// spreads a snapshot it read earlier, not just the fields it cared about).
// This was a real bug: a tab hop could be reverted by a click's step-append
// landing on top of it moments later, using a snapshot read before the hop
// happened -- silently un-tracking the new tab before it was ever injected.
//
// Queuing guarantees each task sees storage exactly as every
// previously-queued task left it, no matter how the unrelated async work
// leading up to enqueueing it (screenshot capture, tab creation, page load)
// happened to be timed.
let recordingSessionQueue: Promise<unknown> = Promise.resolve();

export const enqueueRecordingSessionTask = <T>(task: () => Promise<T>): Promise<T> => {
  const result = recordingSessionQueue.then(task, task);
  recordingSessionQueue = result.catch(() => undefined);
  return result;
};

// Convenience wrapper for the common case: read the current session, hand it
// to `mutate`, write back whatever it returns. Returning undefined from
// `mutate` means "no change" (e.g. a staleness check failed) -- the current
// session is still returned to the caller, just not re-written to storage.
export const updateRecordingSession = (
  mutate: (session: RecordingSession) => RecordingSession | undefined,
): Promise<RecordingSession | undefined> =>
  enqueueRecordingSessionTask(async () => {
    const { recordingSession } = await browser.storage.local.get('recordingSession');
    if (!recordingSession) return undefined;
    const updated = mutate(recordingSession);
    if (!updated) return recordingSession as RecordingSession;
    await browser.storage.local.set({ recordingSession: updated });
    return updated;
  });
