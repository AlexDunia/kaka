import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.VITE_DEV_BACKEND_URL || 'http://localhost:8000'
  return {
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
          target: backendTarget,
          changeOrigin: true,
        },

        '/sanctum': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
