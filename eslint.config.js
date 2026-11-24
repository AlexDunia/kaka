import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfig([
  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,mjs,jsx,vue}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/.vite/**', 'temp1.vue']),

  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  { files: ['scripts/**/*.{js,mjs}', '*.{js,mjs}'], languageOptions: { globals: globals.node } },
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    files: ['src/pages/Register.vue', 'src/pages/Trolio.vue'],
    rules: { 'vue/multi-word-component-names': 'off' },
  },
  // The existing destination guard intentionally rejects control characters.
  { files: ['src/utils/authDestination.js'], rules: { 'no-control-regex': 'off' } },
  skipFormatting,
])
