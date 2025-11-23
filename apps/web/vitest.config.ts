import react from '@vitejs/plugin-react';
import { defineConfig, defaultExclude } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    exclude: [...defaultExclude, 'tests/e2e/**/*'],
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
  },
});
