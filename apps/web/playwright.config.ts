import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
      command: 'pnpm -C .. dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      env: {
        ...process.env,
        ISTANBUL_COVERAGE: process.env.ISTANBUL_COVERAGE ?? '0',
      },
    },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
