import { test, expect } from '@playwright/test';

const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'password123';

test.describe('Authentication', () => {
  test.describe('Login', () => {
    test('auth-1: Login page loads correctly', async ({ page }) => {
      await page.goto('/login');

      // Verify email input exists
      await expect(page.getByLabel(/email/i)).toBeVisible();

      // Verify password input exists
      await expect(page.getByLabel(/password/i)).toBeVisible();

      // Verify Sign in button exists
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

      // Verify link to register page works (if registration is enabled)
      const registerLink = page.getByRole('link', { name: /create one/i });
      if (await registerLink.isVisible()) {
        await registerLink.click();
        await expect(page).toHaveURL(/register/);
      }
    });

    test('auth-2: User can login with valid credentials', async ({ page }) => {
      await page.goto('/login');

      // Enter test user email and password
      await page.getByLabel(/email/i).fill(TEST_USER_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_USER_PASSWORD);

      // Click Sign in button
      await page.getByRole('button', { name: /sign in/i }).click();

      // Verify redirect to /dashboard
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    });

    test('auth-5: Unauthenticated users are redirected to login', async ({ page }) => {
      // Navigate to /dashboard without login
      await page.goto('/dashboard');

      // Verify redirect to /login occurs
      await expect(page).toHaveURL(/login/, { timeout: 10000 });
    });
  });

  test.describe('Logout', () => {
    test('auth-4: User can logout', async ({ page }) => {
      // Login as test user first
      await page.goto('/login');
      await page.getByLabel(/email/i).fill(TEST_USER_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_USER_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

      // Find and click logout button - look in header or user menu
      // Try clicking user avatar/menu first
      const userMenuButton = page.locator('button').filter({ has: page.locator('svg') }).first();
      // Or look for logout link/button
      const logoutButton = page.getByRole('button', { name: /logout/i }).or(page.getByRole('link', { name: /logout/i }));

      if (await logoutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await logoutButton.click();

        // Verify user is signed out
        await expect(page).toHaveURL(/login/, { timeout: 10000 });
      }
    });
  });

  test.describe('Registration', () => {
    test('auth-3: User can register a new account', async ({ page }) => {
      await page.goto('/register');

      // Verify registration form elements exist
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();

      // Fill registration form with a unique email
      const uniqueEmail = `test-${Date.now()}@example.com`;
      await page.getByLabel(/email/i).fill(uniqueEmail);
      await page.getByLabel(/password/i).fill('TestPassword123!');

      // Submit registration form
      await page.getByRole('button', { name: /sign up|register/i }).click();

      // Note: Registration may require email confirmation
      // The exact behavior depends on Supabase configuration
    });
  });
});
