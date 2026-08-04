const pong = async () => {
  const extensionStorage = await browser.storage.local.get();
  window.postMessage(
    {
      source: 'mittelware-intercept-rules-extension',
      type: 'mittelware:intercept:pong',
      version: browser.runtime.getManifest().version,
      storage: extensionStorage,
    },
    "*"
  );
}

const sendToBackground = (type: string, payload: any) => {
  browser.runtime.sendMessage({
    action: type,
    payload: payload,
  });
}

export default defineContentScript({
  matches: ['http://localhost/*', 'https://intercept.mittelware.com/*'],
  main() {
    window.addEventListener('message', async (event) => {
      if (event.data?.source !== 'mittelware-intercept-rules') return;

      if (event.data?.type === 'mittelware:intercept:ping') {
        pong();
      }
      sendToBackground(event.data?.type, event.data?.payload);
    });

    // chrome.sidePanel.open() only succeeds when called synchronously within the
    // same task as the user gesture that triggered it. window.postMessage always
    // defers delivery to a new task, so that gesture context is lost by the time
    // it reaches the background script above. A DOM CustomEvent dispatched via
    // dispatchEvent() is delivered synchronously instead, preserving it.
    document.addEventListener('mittelware:recording:begin', (event) => {
      const url = (event as CustomEvent<string>).detail;
      if (url) {
        browser.runtime.sendMessage({ action: 'mittelware:recording:begin', payload: { url } });
      }
    });

    browser.runtime.onMessage.addListener((message) => {
      if (message.action === 'mittelware:intercept:pong') {
        pong();
      }
    })
  },
});
