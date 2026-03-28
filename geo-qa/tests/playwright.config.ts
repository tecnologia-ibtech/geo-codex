import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'vaadin6',
      testDir: './vaadin6/features',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.VAADIN6_BASE_URL || 'http://localhost:8080/IBTech_Geo/app',
      },
    },
    {
      name: 'vaadin24',
      testDir: './vaadin24/features',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.VAADIN24_BASE_URL || 'http://localhost:8081',
      },
    },
    {
      name: 'pedidos',
      testDir: './pedidos/features',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.PEDIDOS_BASE_URL || 'http://localhost:9000',
      },
    },
  ],
});
