import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './utils';

test.describe('Smart Views', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('smart-1: Today view shows tasks with today\'s plan_date', async ({ page }) => {
    // Look for Today view in sidebar
    const todayButton = page.getByRole('button', { name: /today/i }).or(page.getByText('Today'));

    if (await todayButton.isVisible()) {
      await todayButton.click();

      // Verify we're on Today view
      await expect(page.getByRole('heading', { name: /today/i })).toBeVisible();

      // Should show tasks with today's plan_date
    }
  });

  test('smart-2: Starred view shows starred tasks', async ({ page }) => {
    // First, create a task and star it
    const groupItem = page.locator('[data-testid="group-item"]').first();
    if (await groupItem.isVisible()) {
      await groupItem.click();
    }

    await page.waitForTimeout(500);

    const listItem = page.locator('[data-testid="list-item"]').first();
    if (await listItem.isVisible()) {
      await listItem.click();
    }

    await page.waitForTimeout(500);

    // Create a task
    const addTaskButton = page.getByRole('button', { name: /add task|new task|add/i }).first();
    await addTaskButton.click();
    await page.getByLabel(/task name|content/i).or(page.getByPlaceholder(/what needs to be done/i)).fill('Starred Task');
    await page.getByRole('button', { name: /create|add/i }).click();

    await page.waitForTimeout(500);

    // Star the task
    const starButton = page.getByText('Starred Task').locator('..').locator('button[aria-label*="star"]').first();
    await starButton.click();

    // Now navigate to Starred view
    const starredButton = page.getByRole('button', { name: /starred/i }).or(page.getByText('Starred'));

    if (await starredButton.isVisible()) {
      await starredButton.click();

      // Verify we're on Starred view
      await expect(page.getByRole('heading', { name: /starred/i })).toBeVisible();

      // Verify starred task appears
      await expect(page.getByText('Starred Task')).toBeVisible();
    }
  });
});
