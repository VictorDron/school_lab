import { defineConfig, devices } from '@playwright/test';

/**
 * Wave 1 Playwright setup. Wave 2 will extend with the full happy-path
 * once we have a deterministic seed pipeline for the EnrollmentFormPage.
 *
 * The dev server must already be running on http://localhost:5173. To
 * boot one automatically, set `webServer` below — left commented out so
 * the test runner can reuse a dev server you already started.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: true,
  //   timeout: 120_000,
  // },
});
