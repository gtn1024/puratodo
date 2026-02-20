import { test, expect } from '@playwright/test';
import { loginAsTestUser, TEST_USER_EMAIL, TEST_USER_PASSWORD } from './utils';

test.describe('Group Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('group-1: Display groups in sidebar', async ({ page }) => {
    // Verify groups list appears in sidebar
    const sidebar = page.locator('.hidden.md\\:block');
    await expect(sidebar).toBeVisible();

    // Look for group items - they should have a color dot and name
    const groupItems = page.locator('[data-testid="group-item"]');
    // If no groups exist, we should see empty state or create group prompt
  });

  test('group-2: Create new group', async ({ page }) => {
    // Click Add Group button
    const addGroupButton = page.getByRole('button', { name: /add group|new group/i }).first();
    await addGroupButton.click();

    // Verify dialog/form appears
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Enter group name
    const nameInput = page.getByLabel(/group name|name/i);
    await nameInput.fill('Test Group');

    // Select group color (click a color option)
    const colorOption = page.locator('button[data-color]').first();
    await colorOption.click();

    // Click Create button
    const createButton = page.getByRole('button', { name: /create|save/i });
    await createButton.click();

    // Verify new group appears in sidebar
    await expect(page.getByText('Test Group')).toBeVisible();
  });

  test('group-3: Edit group name and color', async ({ page }) => {
    // First create a group if none exists
    const addGroupButton = page.getByRole('button', { name: /add group|new group/i }).first();
    await addGroupButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await page.getByLabel(/group name|name/i).fill('Original Name');
    await page.locator('button[data-color]').first().click();
    await page.getByRole('button', { name: /create|save/i }).click();

    // Wait for group to appear
    await page.waitForTimeout(500);

    // Click on group menu (three dots or more button)
    const groupMenuButton = page.getByText('Original Name').locator('..').locator('button').last();
    await groupMenuButton.click();

    // Select Edit option
    await page.getByRole('menuitem', { name: /edit/i }).click();

    // Modify group name
    const nameInput = page.getByLabel(/group name|name/i);
    await nameInput.fill('Updated Name');

    // Change color
    const colorOptions = page.locator('button[data-color]');
    await colorOptionsnth(1).click();

    // Click Save button
    await page.getByRole('button', { name: /save|update/i }).click();

    // Verify changes reflect in sidebar
    await expect(page.getByText('Updated Name')).toBeVisible();
  });

  test('group-4: Delete group with confirmation', async ({ page }) => {
    // First create a group if none exists
    const addGroupButton = page.getByRole('button', { name: /add group|new group/i }).first();
    await addGroupButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await page.getByLabel(/group name|name/i).fill('Group To Delete');
    await page.locator('button[data-color]').first().click();
    await page.getByRole('button', { name: /create|save/i }).click();

    // Wait for group to appear
    await page.waitForTimeout(500);

    // Click on group menu
    const groupMenuButton = page.getByText('Group To Delete').locator('..').locator('button').last();
    await groupMenuButton.click();

    // Select Delete option
    await page.getByRole('menuitem', { name: /delete/i }).click();

    // Confirm deletion in the dialog
    const confirmDeleteButton = page.getByRole('button', { name: /delete|confirm/i });
    await confirmDeleteButton.click();

    // Verify group is removed from sidebar
    await expect(page.getByText('Group To Delete')).not.toBeVisible();
  });
});
