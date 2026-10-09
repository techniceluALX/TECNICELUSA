import { defineConfig, devices } from '@playwright/test';

const AUTH_STATE = 'tests/admin/.auth/admin-state.json';

export default defineConfig({
  testDir: './tests/admin',
  fullyParallel: false,
  retries: 0,
  reporter: [
    ['html', { outputFolder: 'tests/admin-report' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.ADMIN_BASE_URL || 'https://preview.tecnicelu.pages.dev',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    locale: 'es-ES',
  },
  projects: [
    { name: 'admin-auth-setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'admin-walkthrough-mobile',
      use: { ...devices['Pixel 5'], storageState: AUTH_STATE },
      dependencies: ['admin-auth-setup'],
    },
    {
      name: 'admin-walkthrough-desktop',
      use: { ...devices['Desktop Chrome'], storageState: AUTH_STATE },
      dependencies: ['admin-auth-setup'],
    },
  ],
});