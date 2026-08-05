export const updateDNR = async (rules: any) => {
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

export const sendToMittelware = async (action: string) => {
  const tabs = await browser.tabs.query({ url: `${import.meta.env.VITE_HOST_URL}/*`});
  for (const tab of tabs) {
    if (tab.id) {
      browser.tabs.sendMessage(tab.id, {
        action,
      })
    }
  }
}
