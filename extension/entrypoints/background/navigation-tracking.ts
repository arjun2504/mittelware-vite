// Extra time to let an SPA finish rendering after the tab reports 'complete' --
// 'complete' only means the initial document/scripts have loaded, not that the
// app has mounted and painted anything yet.
export const SPA_SETTLE_DELAY_MS = 500;
// Upper bound so a page that never reaches 'complete' (streaming responses,
// long-lived connections, etc.) can't hang the recording indefinitely.
export const MAX_LOAD_WAIT_MS = 8000;

// New Tab Page / empty tabs (e.g. the user pressing Ctrl+T) never have a real
// destination at creation time, unlike a tab spawned by a link click.
const BLANK_TAB_URLS = new Set(['', 'about:blank', 'chrome://newtab/']);
export const isBlankTabUrl = (url?: string) => !url || BLANK_TAB_URLS.has(url);

// Generic cache+waiter for a per-tab webNavigation event: resolve() feeds it
// from a listener, wait() resolves once a matching event has been observed
// (cached, or the next one to happen) or timeoutMs elapses. Used below for
// both "navigation committed" and "navigation completed" -- necessary for
// the same reason settleTrackedTabStart (see settle-navigation.ts) is called
// directly from followChildTab/beginRecording rather than solely relying on
// the listener: a child tab's navigation can commit/complete before it's
// even marked tracked, and both events fire exactly once per navigation, so
// listening only after the tab becomes tracked can miss them forever.
const createTabNavigationTracker = () => {
  const last = new Map<number, string>();
  const waiters = new Map<number, Array<(url: string) => void>>();

  const resolve = (tabId: number, url: string) => {
    last.set(tabId, url);
    const list = waiters.get(tabId);
    if (!list) return;
    waiters.delete(tabId);
    list.forEach((fn) => fn(url));
  };

  const forget = (tabId: number) => {
    last.delete(tabId);
    waiters.delete(tabId);
  };

  const wait = (tabId: number, timeoutMs = MAX_LOAD_WAIT_MS): Promise<string | undefined> => {
    const cached = last.get(tabId);
    if (cached !== undefined) return Promise.resolve(cached);

    return new Promise((res) => {
      let settled = false;
      const onResolve = (url: string) => finish(url);
      const finish = (url?: string) => {
        if (settled) return;
        settled = true;
        const list = waiters.get(tabId);
        if (list) {
          const idx = list.indexOf(onResolve);
          if (idx !== -1) list.splice(idx, 1);
          if (list.length === 0) waiters.delete(tabId);
        }
        res(url);
      };
      const list = waiters.get(tabId) ?? [];
      list.push(onResolve);
      waiters.set(tabId, list);
      setTimeout(() => finish(undefined), timeoutMs);
    });
  };

  return { resolve, forget, wait };
};

// Fed by webNavigation.onCommitted (frameId 0, see index.ts) -- resolves
// fast, as soon as Chrome has decided to show the new document, long before
// it's actually finished loading. Used to inject the recorder as early as
// possible: every extra ms before injection is a click in the new tab that
// nothing is listening for yet, and if the user reacts by clicking back in
// the OLD tab instead (whose listeners are still live there), it looks like
// the new tab just never records at all.
export const committedNavigation = createTabNavigationTracker();
// Fed by webNavigation.onCompleted (frameId 0, see index.ts) -- resolves
// once the page and its subresources have actually finished loading. This
// can take seconds on a heavy page, so it's used only for the
// "Navigate to..." step's own screenshot/description, never to gate click
// capture.
//
// This (onCompleted) replaced an earlier tabs.onUpdated-based wait
// (status === 'complete'), which was unreliable per-site: a brand-new tab
// frequently commits a transient initial document and reports *that* as
// 'complete' before the real destination even starts loading, and how
// often/reliably that happens varies by site (cross-process navigations,
// sites that window.open('') then set location.href via JS, etc.) --
// exactly the "works for some sites, not others" symptom. Per Chrome's
// webNavigation semantics, a tab's initial about:blank document is never
// reported as a navigation at all, so onCommitted/onCompleted only ever fire
// for real ones.
export const completedNavigation = createTabNavigationTracker();

export const forgetTabNavigations = (tabId: number) => {
  committedNavigation.forget(tabId);
  completedNavigation.forget(tabId);
};
