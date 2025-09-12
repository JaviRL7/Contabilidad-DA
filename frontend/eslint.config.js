import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Prohibir console statements excepto error y warn
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Prohibir debugger
      'no-debugger': 'error',
      // Variables no utilizadas
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }],
      // Imports no utilizados
      'no-unused-expressions': 'warn',
      // Alertar sobre any explícito
      '@typescript-eslint/no-explicit-any': 'warn',
      // Prohibir variables no inicializadas
      'no-undef-init': 'warn'
    },
  },
])
