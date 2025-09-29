const updateDNR = async (rules: any) => {
  const dynamicRules = await browser.declarativeNetRequest.getDynamicRules();
  const updatedDnr = {
    removeRuleIds: dynamicRules.map((rule) => rule.id),
    addRules: rules
  };
  browser.declarativeNetRequest.updateDynamicRules(updatedDnr, () => {
    if (browser.runtime.lastError) {
      console.error('Failed to update rules: ', browser.runtime.lastError, rules);
    }
  });
}

const sendToMittelware = async (action: string) => {
  const tabs = await browser.tabs.query({ url: `${import.meta.env.VITE_HOST_URL}/*`});
  for (const tab of tabs) {
    if (tab.id) {
      browser.tabs.sendMessage(tab.id, {
        action,
      })
    }
  }
}

export default defineBackground({
  persistent: true,
  main() {
    browser.runtime.onMessage.addListener(async (message) => {
      const { settings, rules } = await browser.storage.local.get(['settings', 'rules']);
      if (message.action === 'mittelware:rules:sync') {
        const { rules: newRules } = message.payload;
        await browser.storage.local.set({ rules: newRules }); // update local storage

        if (!settings.isPaused) {
          updateDNR(newRules);
        }
      } else if (message.action === 'mittelware:rules:sync:pause') {
        updateDNR(settings.isPaused ? [] : rules);
        sendToMittelware('mittelware:intercept:pong');
      } else if (message.action === 'mittelware:intercept:ping') {
        sendToMittelware('mittelware:intercept:pong');
      }
    });

    browser.runtime.onInstalled.addListener(() => {
      browser.storage.local.set({
        settings: {
          isPaused: false,
        }
      })
      // browser.tabs.create({ url: 'https://intercept.mittelware.com' });
    });
  }
});
