import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

/**
 * Pruebas de componentes (Vitest + jsdom + Testing Library).
 *
 * Reutiliza `vite.config.ts` sin modificarlo y solo incluye `tests/**\/*.spec.tsx`,
 * para no mezclarse con las pruebas de `node --test` (`tests/*.test.ts`).
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      include: ['tests/**/*.spec.tsx'],
    },
  }),
)
