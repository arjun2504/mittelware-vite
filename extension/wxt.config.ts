import { defineConfig } from 'wxt';
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  dev: {
    open: false, // Prevents auto-opening the browser
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  autoIcons: {
    baseIconPath: 'assets/icon.svg',
  },
  manifest: {
    "permissions": [
      "declarativeNetRequest",
      "declarativeNetRequestWithHostAccess",
      "unlimitedStorage",
      "storage",
      "sidePanel",
      "tabs",
      "webNavigation",
      "scripting"
    ],
    "host_permissions": ["<all_urls>"]
  }
});
