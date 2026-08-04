type StepType = 'click' | 'type';

const IDLE_FLUSH_MS = 800;

const NON_INTERACTIVE_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'HTML', 'BODY']);

const describeElement = (el: Element | null): string => {
  if (!el || NON_INTERACTIVE_TAGS.has(el.tagName)) return 'element';
  const label = el.getAttribute('aria-label')
    || (el as HTMLInputElement).placeholder
    || el.getAttribute('name')
    || el.getAttribute('title')
    || el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 60)
    || '';
  return label || el.tagName.toLowerCase();
};

const sendStep = (type: StepType, description: string) => {
  browser.runtime.sendMessage({
    action: 'mittelware:recording:step',
    payload: { type, description },
  });
};

export default defineContentScript({
  matches: ['<all_urls>'],
  // Injected on demand (see background.ts's injectRecorder) only into the tab
  // actively being recorded, instead of into every page load in the browser.
  registration: 'runtime',
  main() {
    let typedBuffer = '';
    let typedTarget: Element | null = null;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const clearIdleTimer = () => {
      if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
    };

    const flushTyped = () => {
      clearIdleTimer();
      if (!typedBuffer) {
        typedTarget = null;
        return;
      }
      sendStep('type', `Type "${typedBuffer}" on ${describeElement(typedTarget)}`);
      typedBuffer = '';
      typedTarget = null;
    };

    const recordClick = (target: Element | null) => {
      flushTyped();
      sendStep('click', `Click on "${describeElement(target)}"`);
    };

    // Captured on mousedown (not click) so the screenshot request reaches the
    // background before the click's default action (e.g. link navigation) has
    // a chance to start -- waiting for 'click' means the screenshot is often
    // taken of the page the click navigated *to*, not the one that was clicked.
    const onMouseDown = (event: MouseEvent) => {
      // Ignore synthetic events dispatched by page JS (e.g. analytics scripts
      // calling element.click() on hidden nodes) and non-primary buttons.
      if (!event.isTrusted || event.button !== 0) return;
      recordClick(event.target as Element | null);
    };

    // Keyboard-activated clicks (Enter/Space on a focused button) never fire
    // mousedown, so catch those here. event.detail === 0 distinguishes a
    // keyboard-triggered click from a real mouse click (which mousedown already
    // handled and detail would be >= 1 for).
    const onClick = (event: MouseEvent) => {
      if (!event.isTrusted || event.detail !== 0) return;
      recordClick(event.target as Element | null);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as Element | null;
      const isEditable = !!target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        (target as HTMLElement).isContentEditable
      );
      if (!isEditable) return;

      if (event.key === 'Enter' || event.key === 'Tab') {
        flushTyped();
        return;
      }
      if (event.key === 'Backspace') {
        typedTarget = target;
        typedBuffer = typedBuffer.slice(0, -1);
      } else if (event.key.length === 1) {
        typedTarget = target;
        typedBuffer += event.key;
      } else {
        return; // ignore other non-printable keys (Shift, Ctrl, arrows, etc.)
      }

      clearIdleTimer();
      idleTimer = setTimeout(flushTyped, IDLE_FLUSH_MS);
    };

    const onBlur = (event: FocusEvent) => {
      if (event.target === typedTarget) {
        flushTyped();
      }
    };

    document.addEventListener('mousedown', onMouseDown, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);
    // blur doesn't bubble, but does fire during the capture phase on ancestors
    document.addEventListener('blur', onBlur, true);

    browser.runtime.onMessage.addListener((message) => {
      if (message?.action === 'mittelware:recording:stop') {
        flushTyped();
        document.removeEventListener('mousedown', onMouseDown, true);
        document.removeEventListener('click', onClick, true);
        document.removeEventListener('keydown', onKeyDown, true);
        document.removeEventListener('blur', onBlur, true);
      }
    });
  },
});
