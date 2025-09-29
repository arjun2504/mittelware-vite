import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": "/src",
      "@/pages": "/src/pages",
      "@/layouts": "/src/layouts",
      "@/components": "/src/components",
      "@/assets": "/src/assets",
      "@/services": "/src/services",
      "@/utils": "/src/utils",
      "@/hooks": "/src/hooks",
      "@/rules": "/src/rules",
      "@/constants": "/src/constants",
      "@/context": "/src/context",
    }
  },
  plugins: [
    svgr(),
    react(),
    tailwindcss(),
  ],
})
