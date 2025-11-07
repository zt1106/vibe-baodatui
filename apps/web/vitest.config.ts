import { defineConfig, defaultExclude } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    exclude: [...defaultExclude, 'tests/e2e/**/*'],
  },
});
