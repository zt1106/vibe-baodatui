import react from '@vitejs/plugin-react';
import { defineConfig, defaultExclude } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    exclude: [...defaultExclude, 'tests/e2e/**/*'],
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html', 'lcov'],
      reportsDirectory: './coverage/unit',
      include: [
        'app/**/*.{ts,tsx}',
        'components/**/*.{ts,tsx}',
        'hooks/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}',
      ],
      exclude: [
        'app/api/**/*',
        '**/*.d.ts',
        '**/*.stories.{ts,tsx}',
        '**/__tests__/**/*',
        'test/**/*',
        'tests/**/*',
      ],
    },
  },
});
