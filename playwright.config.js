const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 1,
  workers: 4,

  reporter: [
    ['html'],
    ['list']
  ],

  use: {
    baseURL: 'http://localhost:1313',
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
    command: 'hugo server --disableFastRender',
    url: 'http://localhost:1313',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});
