import { Page } from '@playwright/test';

export const TEST_USER_EMAIL = 'test@example.com';
export const TEST_USER_PASSWORD = 'password123';

/**
 * Login as test user - helper function for tests
 */
export async function loginAsTestUser(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(TEST_USER_EMAIL);
  await page.getByLabel(/password/i).fill(TEST_USER_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 10000 });
}
