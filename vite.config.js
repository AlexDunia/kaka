import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig(({ command }) => ({
  plugins: [vue(), vueJsx()],

  /*
   * Local development runs directly from:
   * http://localhost:5174/
   *
   * The deployed build keeps the existing /kaka/
   * base path.
   */
  base: command === 'serve' ? '/' : '/kaka/',

  server: {
    port: 5174,
    strictPort: true,

    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },

      '/sanctum': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))
