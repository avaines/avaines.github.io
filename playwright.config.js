const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  outputDir: process.env.CHECK_EXTERNAL_LINKS ? 'external-link-results' : 'test-results',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  grep: process.env.CHECK_EXTERNAL_LINKS ? /@external/ : undefined,
  grepInvert: process.env.CHECK_EXTERNAL_LINKS ? undefined : /@external/,
  retries: process.env.CI && !process.env.CHECK_EXTERNAL_LINKS ? 1 : 0,
  workers: process.env.CI ? 2 : 4,

  reporter: [
    ['html', { open: 'never', outputFolder: process.env.CHECK_EXTERNAL_LINKS ? 'external-link-report' : 'playwright-report' }],
    ['list']
  ],

  use: {
    baseURL: 'http://127.0.0.1:4173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run build -- --baseURL http://127.0.0.1:4173/ --destination .test-site --cleanDestinationDir && python3 -m http.server 4173 --bind 127.0.0.1 --directory .test-site',
    url: 'http://127.0.0.1:4173',
    timeout: 120 * 1000,
    reuseExistingServer: false,
  },
});
