export type RecordingStep = {
  type: 'navigate' | 'click' | 'type';
  description: string;
  screenshot?: string;
  // Viewport-relative (0-1) coordinates of the clicked/typed element, set by
  // recorder.content.ts. Lets the web app's review screen zoom the screenshot
  // in on the right spot without cropping the underlying image.
  point?: { x: number; y: number };
};

export type RecordingSession = {
  tabId: number;
  webappTabId: number;
  url: string;
  steps: RecordingStep[];
  startedAt: string;
  // True right after `tabId` starts being tracked (initial tab, or a followed
  // child tab -- see `followChildTab`) until that tab's first navigation has
  // been captured as a step.
  awaitingNavigationStep: boolean;
  // Timestamp of the last captured step, used by `followChildTab` to decide
  // whether an opener-less new tab was plausibly spawned by a click we just
  // recorded (see the rel="noopener" note there).
  lastStepAt: string;
  // The tab we were tracking right before following a child tab into this one
  // (see `followChildTab`). Lets us hop back if this tab closes itself, e.g. a
  // popup that finishes an OAuth flow and calls window.close().
  previousTabId?: number;
  // Every tab that has ever been part of this recording's lineage (the
  // initial tab plus every tab followChildTab has hopped into). Lets
  // handleTabActivated (see follow-tab.ts) tell "the user switched back to a
  // tab that's genuinely part of this recording" apart from "the user
  // checked an unrelated tab" -- only the former should move tracking.
  knownTabIds: number[];
};
