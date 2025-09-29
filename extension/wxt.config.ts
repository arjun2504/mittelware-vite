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
  manifest: {
    "permissions": [
      "declarativeNetRequest",
      "declarativeNetRequestWithHostAccess",
      "unlimitedStorage",
      "storage"
    ],
    "host_permissions": ["<all_urls>"]
  }
});
