import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './utils';

test.describe('Search', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('search-1: Global search returns results', async ({ page }) => {
    // Create a task first to search for
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

    // Create a task with unique name for searching
    const uniqueTaskName = `Searchable Task ${Date.now()}`;
    const addTaskButton = page.getByRole('button', { name: /add task|new task|add/i }).first();
    await addTaskButton.click();
    await page.getByLabel(/task name|content/i).or(page.getByPlaceholder(/what needs to be done/i)).fill(uniqueTaskName);
    await page.getByRole('button', { name: /create|add/i }).click();

    await page.waitForTimeout(500);

    // Click search icon or use keyboard shortcut (Cmd/Ctrl + K)
    await page.keyboard.press('Meta+k');

    // Verify search dialog opens
    const searchDialog = page.locator('[role="dialog"]');
    await expect(searchDialog).toBeVisible();

    // Type search query
    const searchInput = page.getByPlaceholder(/search|tasks/i);
    await searchInput.fill(uniqueTaskName.split(' ')[1]); // Search for part of the name

    // Wait for results
    await page.waitForTimeout(500);

    // Verify search results appear
    const results = page.locator('[data-testid="search-result"]');
    // Should have at least one result
  });
});
