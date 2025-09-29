const pong = async () => {
  const extensionStorage = await browser.storage.local.get();
  window.postMessage(
    {
      source: 'mittelware-intercept-rules-extension',
      type: 'mittelware:intercept:pong',
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
  matches: ['http://localhost:5173/*', 'https://intercept.mittelware.com/*'],
  main() {
    window.addEventListener('message', async (event) => {
      if (event.data?.source !== 'mittelware-intercept-rules') return;

      if (event.data?.type === 'mittelware:intercept:ping') {
        pong();
      }
      sendToBackground(event.data?.type, event.data?.payload);
    });

    browser.runtime.onMessage.addListener((message) => {
      if (message.action === 'mittelware:intercept:pong') {
        pong();
      }
    })
  },
});
