type StepType = 'click' | 'type';
type Point = { x: number; y: number };

const IDLE_FLUSH_MS = 800;

const NON_INTERACTIVE_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'HTML', 'BODY']);

const describeElement = (el: Element | null | undefined): string => {
  if (!el || NON_INTERACTIVE_TAGS.has(el.tagName)) return 'element';
  const label = el.getAttribute('aria-label')
    || (el as HTMLInputElement).placeholder
    || el.getAttribute('name')
    || el.getAttribute('title')
    || el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 60)
    || '';
  return label || el.tagName.toLowerCase();
};

const normalizeEventTarget = (target: EventTarget | null): Element | null => {
  if (!target) return null;
  if (target instanceof Element) return target;
  if (target instanceof Node) return target.parentElement;
  return null;
};

const eventTargetFromEvent = (event: Event): Element | null => {
  const path = (event as unknown as { composedPath?: () => EventTarget[] }).composedPath?.();
  if (Array.isArray(path)) {
    for (const node of path) {
      if (node instanceof Element) return node;
    }
  }
  return normalizeEventTarget(event.target as EventTarget | null);
};

// Viewport-relative (0-1) coordinates, not pixels -- captureVisibleTab may
// capture at a different pixel density than window.innerWidth/innerHeight
// (devicePixelRatio), but a 0-1 ratio maps onto the screenshot either way.
const ratioPoint = (x: number, y: number): Point => ({
  x: Math.min(1, Math.max(0, x / window.innerWidth)),
  y: Math.min(1, Math.max(0, y / window.innerHeight)),
});

const pointForElement = (el: Element | null): Point | undefined => {
  if (!el) return undefined;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return undefined;
  return ratioPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
};

const sendStep = (type: StepType, description: string, point?: Point) => {
  console.log('[mittelware] recorder content sendStep', { type, description, point, href: window.location.href });
  browser.runtime.sendMessage({
    action: 'mittelware:recording:step',
    payload: { type, description, point },
  }).catch((error) => {
    console.error('[mittelware] recorder content sendStep failed', error, { type, description, point, href: window.location.href });
  });
};

export default defineContentScript({
  matches: ['<all_urls>'],
  // Injected on demand (see background.ts's injectRecorder) only into the tab
  // actively being recorded, instead of into every page load in the browser.
  registration: 'runtime',
  main() {
    if ((window as unknown as { __mittelwareRecorderInitialized?: boolean }).__mittelwareRecorderInitialized) {
      console.log('[mittelware] recorder content already initialized', { href: window.location.href });
      return;
    }
    (window as unknown as { __mittelwareRecorderInitialized?: boolean }).__mittelwareRecorderInitialized = true;
    console.log('[mittelware] recorder content main loaded', { href: window.location.href });
    browser.runtime.sendMessage({ action: 'mittelware:recording:content-loaded', payload: { href: window.location.href } });
    let typedBuffer = '';
    let typedTarget: Element | null = null;
    let typedPoint: Point | undefined;
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
        typedPoint = undefined;
        return;
      }
      sendStep('type', `Type "${typedBuffer}" on ${describeElement(typedTarget)}`, typedPoint);
      typedBuffer = '';
      typedTarget = null;
      typedPoint = undefined;
    };

    const recordClick = (event: Event, point?: Point) => {
      flushTyped();
      const normalizedTarget = eventTargetFromEvent(event);
      sendStep('click', `Click on "${describeElement(normalizedTarget)}"`, point ?? pointForElement(normalizedTarget));
    };

    // Captured on pointerdown so the screenshot request reaches the background
    // before the click's default action (e.g. link navigation) has a chance to
    // start.
    const onPointerDown = (event: PointerEvent) => {
      // Ignore synthetic events dispatched by page JS (e.g. analytics scripts
      // calling element.click() on hidden nodes) and non-primary buttons.
      if (!event.isTrusted || event.button !== 0) return;
      console.log('[mittelware] recorder content onPointerDown', {
        target: event.target,
        href: window.location.href,
        clientX: event.clientX,
        clientY: event.clientY,
        composedPath: (event as unknown as { composedPath?: () => EventTarget[] }).composedPath?.(),
      });
      recordClick(event, ratioPoint(event.clientX, event.clientY));
    };

    // Keyboard-activated clicks (Enter/Space on a focused button) never fire
    // mousedown, so catch those here. event.detail === 0 distinguishes a
    // keyboard-triggered click from a real mouse click (which mousedown already
    // handled and detail would be >= 1 for). clientX/clientY are 0 for these
    // synthetic clicks, so fall back to the target element's own position.
    const onClick = (event: MouseEvent) => {
      if (!event.isTrusted || event.detail !== 0) return;
      console.log('[mittelware] recorder content onClick', {
        target: event.target,
        href: window.location.href,
        composedPath: (event as unknown as { composedPath?: () => EventTarget[] }).composedPath?.(),
      });
      recordClick(event);
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
        typedPoint = pointForElement(target);
        typedBuffer = typedBuffer.slice(0, -1);
      } else if (event.key.length === 1) {
        typedTarget = target;
        typedPoint = pointForElement(target);
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

    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);
    // blur doesn't bubble, but does fire during the capture phase on ancestors
    document.addEventListener('blur', onBlur, true);

    browser.runtime.onMessage.addListener((message) => {
      if (message?.action === 'mittelware:recording:stop') {
        flushTyped();
        window.removeEventListener('pointerdown', onPointerDown, true);
        window.removeEventListener('click', onClick, true);
        document.removeEventListener('keydown', onKeyDown, true);
        document.removeEventListener('blur', onBlur, true);
      }
      if (message?.action === 'mittelware:recording:ping') {
        return Promise.resolve('pong');
      }
    });
  },
});
