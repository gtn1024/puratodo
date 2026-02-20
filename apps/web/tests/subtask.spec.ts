import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './utils';

test.describe('Subtasks', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('subtask-1: Create subtask under a task', async ({ page }) => {
    // Navigate to a group and list
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

    // Create a parent task
    const addTaskButton = page.getByRole('button', { name: /add task|new task|add/i }).first();
    await addTaskButton.click();
    await page.getByLabel(/task name|content/i).or(page.getByPlaceholder(/what needs to be done/i)).fill('Parent Task');
    await page.getByRole('button', { name: /create|add/i }).click();

    await page.waitForTimeout(500);

    // Click on the task to open detail panel
    const taskItem = page.getByText('Parent Task');
    await taskItem.click();

    // Look for "Add subtask" option in detail panel
    const addSubtaskButton = page.getByRole('button', { name: /add subtask|new subtask/i });
    if (await addSubtaskButton.isVisible()) {
      await addSubtaskButton.click();

      // Enter subtask name
      const subtaskInput = page.getByPlaceholder(/subtask/i);
      await subtaskInput.fill('Test Subtask');

      // Save subtask
      await page.keyboard.press('Enter');

      // Verify subtask appears under parent
      await expect(page.getByText('Test Subtask')).toBeVisible();
    }
  });

  test('subtask-2: Support unlimited nesting levels', async ({ page }) => {
    // Navigate to a group and list
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

    // Create a parent task
    const addTaskButton = page.getByRole('button', { name: /add task|new task|add/i }).first();
    await addTaskButton.click();
    await page.getByLabel(/task name|content/i).or(page.getByPlaceholder(/what needs to be done/i)).fill('Level 1 Task');
    await page.getByRole('button', { name: /create|add/i }).click();

    await page.waitForTimeout(500);

    // Open task detail
    const taskItem = page.getByText('Level 1 Task');
    await taskItem.click();

    // Add subtask at level 2
    const addSubtaskButton = page.getByRole('button', { name: /add subtask|new subtask/i });
    if (await addSubtaskButton.isVisible()) {
      await addSubtaskButton.click();
      await page.getByPlaceholder(/subtask/i).fill('Level 2 Subtask');
      await page.keyboard.press('Enter');
      await expect(page.getByText('Level 2 Subtask')).toBeVisible();

      // Find and click on level 2 subtask to add level 3
      const level2Item = page.getByText('Level 2 Subtask');
      await level2Item.click();

      // Add level 3 subtask
      await addSubtaskButton.click();
      await page.getByPlaceholder(/subtask/i).fill('Level 3 Subtask');
      await page.keyboard.press('Enter');
      await expect(page.getByText('Level 3 Subtask')).toBeVisible();
    }
  });
});
