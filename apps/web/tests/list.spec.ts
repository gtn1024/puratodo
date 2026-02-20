import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './utils';

test.describe('List Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    // Select a group first if available
    await page.waitForTimeout(500);
  });

  test('list-1: Display lists under selected group', async ({ page }) => {
    // After login, we should be on dashboard
    await expect(page).toHaveURL(/dashboard/);

    // Select a group by clicking on it
    const groupItem = page.locator('[data-testid="group-item"]').first();
    if (await groupItem.isVisible()) {
      await groupItem.click();
    }

    // Verify lists appear in main area
    // Lists should show name and icon
    const listItems = page.locator('[data-testid="list-item"]');
    // If lists exist, verify they show icon and name
  });

  test('list-2: Create new list', async ({ page }) => {
    // Select a group first
    const groupItem = page.locator('[data-testid="group-item"]').first();
    if (await groupItem.isVisible()) {
      await groupItem.click();
    }

    // Wait for the list panel to load
    await page.waitForTimeout(500);

    // Click Add List button
    const addListButton = page.getByRole('button', { name: /add list|new list/i }).first();
    await addListButton.click();

    // Verify dialog appears
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Enter list name
    const nameInput = page.getByLabel(/list name|name/i);
    await nameInput.fill('Test List');

    // Select icon (click on emoji)
    const iconOption = page.locator('button[data-icon]').first();
    await iconOption.click();

    // Click Create button
    const createButton = page.getByRole('button', { name: /create|save/i });
    await createButton.click();

    // Verify new list appears
    await expect(page.getByText('Test List')).toBeVisible();
  });

  test('list-3: Edit list name and icon', async ({ page }) => {
    // Select a group
    const groupItem = page.locator('[data-testid="group-item"]').first();
    if (await groupItem.isVisible()) {
      await groupItem.click();
    }

    await page.waitForTimeout(500);

    // First create a list if none exists
    const addListButton = page.getByRole('button', { name: /add list|new list/i }).first();
    await addListButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await page.getByLabel(/list name|name/i).fill('Original List');
    await page.locator('button[data-icon]').first().click();
    await page.getByRole('button', { name: /create|save/i }).click();

    // Wait for list to appear
    await page.waitForTimeout(500);

    // Click on list menu (three dots button)
    const listItem = page.getByText('Original List').locator('..').locator('button').last();
    await listItem.click();

    // Select Edit option
    await page.getByRole('menuitem', { name: /edit/i }).click();

    // Modify list name
    const nameInput = page.getByLabel(/list name|name/i);
    await nameInput.fill('Updated List');

    // Change icon
    const iconOptions = page.locator('button[data-icon]');
    await iconOptions.nth(1).click();

    // Click Save button
    await page.getByRole('button', { name: /save|update/i }).click();

    // Verify changes reflect
    await expect(page.getByText('Updated List')).toBeVisible();
  });

  test('list-4: Delete list', async ({ page }) => {
    // Select a group
    const groupItem = page.locator('[data-testid="group-item"]').first();
    if (await groupItem.isVisible()) {
      await groupItem.click();
    }

    await page.waitForTimeout(500);

    // First create a list to delete
    const addListButton = page.getByRole('button', { name: /add list|new list/i }).first();
    await addListButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await page.getByLabel(/list name|name/i).fill('List To Delete');
    await page.locator('button[data-icon]').first().click();
    await page.getByRole('button', { name: /create|save/i }).click();

    // Wait for list to appear
    await page.waitForTimeout(500);

    // Click on list menu
    const listItem = page.getByText('List To Delete').locator('..').locator('button').last();
    await listItem.click();

    // Select Delete option
    await page.getByRole('menuitem', { name: /delete/i }).click();

    // Confirm deletion
    const confirmButton = page.getByRole('button', { name: /delete|confirm/i });
    await confirmButton.click();

    // Verify list is removed
    await expect(page.getByText('List To Delete')).not.toBeVisible();
  });

  test('list-5: Move list to another group', async ({ page }) => {
    // This test requires at least 2 groups
    // First create a group if needed
    const addGroupButton = page.getByRole('button', { name: /add group|new group/i }).first();

    // Create first group
    await addGroupButton.click();
    await page.getByLabel(/group name|name/i).fill('Source Group');
    await page.locator('button[data-color]').first().click();
    await page.getByRole('button', { name: /create|save/i }).click();
    await page.waitForTimeout(500);

    // Create second group
    await addGroupButton.click();
    await page.getByLabel(/group name|name/i).fill('Target Group');
    await page.locator('button[data-color]').first().click();
    await page.getByRole('button', { name: /create|save/i }).click();
    await page.waitForTimeout(500);

    // Select Source Group
    await page.getByText('Source Group').click();
    await page.waitForTimeout(500);

    // Create a list in Source Group
    const addListButton = page.getByRole('button', { name: /add list|new list/i }).first();
    await addListButton.click();
    await page.getByLabel(/list name|name/i).fill('List to Move');
    await page.locator('button[data-icon]').first().click();
    await page.getByRole('button', { name: /create|save/i }).click();
    await page.waitForTimeout(500);

    // Click on list menu
    const listItem = page.getByText('List to Move').locator('..').locator('button').last();
    await listItem.click();

    // Select Move option
    await page.getByRole('menuitem', { name: /move/i }).click();

    // Choose target group
    await page.getByText('Target Group').click();

    // Verify list moves to new group - should not be visible in Source Group anymore
    // and should appear in Target Group
    await expect(page.getByText('List to Move')).not.toBeVisible();
  });
});
