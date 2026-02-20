import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './utils';

test.describe('Task Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('task-1: Display tasks under selected list', async ({ page }) => {
    // Navigate to a group
    const groupItem = page.locator('[data-testid="group-item"]').first();
    if (await groupItem.isVisible()) {
      await groupItem.click();
    }

    await page.waitForTimeout(500);

    // Click on a list
    const listItem = page.locator('[data-testid="list-item"]').first();
    if (await listItem.isVisible()) {
      await listItem.click();
    }

    // Verify tasks appear in main area
    const taskItems = page.locator('[data-testid="task-item"]');
    // Tasks should show name and completion status (checkbox)
  });

  test('task-2: Create new task', async ({ page }) => {
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

    // Click Add Task button
    const addTaskButton = page.getByRole('button', { name: /add task|new task|add/i }).first();
    await addTaskButton.click();

    // Verify dialog appears
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Enter task name
    const nameInput = page.getByLabel(/task name|content/i).or(page.getByPlaceholder(/what needs to be done/i));
    await nameInput.fill('Test Task');

    // Click Create button
    const createButton = page.getByRole('button', { name: /create|add/i });
    await createButton.click();

    // Verify new task appears
    await expect(page.getByText('Test Task')).toBeVisible();
  });

  test('task-3: Mark task as complete/incomplete', async ({ page }) => {
    // First create a task
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
    await page.getByLabel(/task name|content/i).or(page.getByPlaceholder(/what needs to be done/i)).fill('Task to Complete');
    await page.getByRole('button', { name: /create|add/i }).click();

    await page.waitForTimeout(500);

    // Click checkbox on task
    const checkbox = page.locator('[data-testid="task-checkbox"]').first();
    await checkbox.click();

    // Verify task shows completed state (strikethrough or different style)
    const taskText = page.getByText('Task to Complete');
    await expect(taskText).toHaveClass(/line-through/);

    // Click again to toggle back to incomplete
    await checkbox.click();

    // Verify status changes back
    await expect(taskText).not.toHaveClass(/line-through/);
  });

  test('task-4: Edit task name', async ({ page }) => {
    // First create a task
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
    await page.getByLabel(/task name|content/i).or(page.getByPlaceholder(/what needs to be done/i)).fill('Original Task Name');
    await page.getByRole('button', { name: /create|add/i }).click();

    await page.waitForTimeout(500);

    // Click on task to open detail panel or click edit
    const taskItem = page.getByText('Original Task Name');
    await taskItem.click();

    // If detail panel opens, look for edit mode
    // Or right-click for context menu
    await taskItem.click({ button: 'right' });

    // Select Edit option
    await page.getByRole('menuitem', { name: /edit/i }).click();

    // Modify task name
    const nameInput = page.getByLabel(/task name|content/i);
    await nameInput.fill('Updated Task Name');

    // Save changes
    await page.getByRole('button', { name: /save|update/i }).click();

    // Verify new name displays
    await expect(page.getByText('Updated Task Name')).toBeVisible();
  });

  test('task-5: Delete task', async ({ page }) => {
    // First create a task
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
    await page.getByLabel(/task name|content/i).or(page.getByPlaceholder(/what needs to be done/i)).fill('Task To Delete');
    await page.getByRole('button', { name: /create|add/i }).click();

    await page.waitForTimeout(500);

    // Right-click on task for context menu
    const taskItem = page.getByText('Task To Delete');
    await taskItem.click({ button: 'right' });

    // Select Delete option
    await page.getByRole('menuitem', { name: /delete/i }).click();

    // Verify task is removed
    await expect(page.getByText('Task To Delete')).not.toBeVisible();
  });

  test('task-6: Star/unstar a task', async ({ page }) => {
    // First create a task
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
    await page.getByLabel(/task name|content/i).or(page.getByPlaceholder(/what needs to be done/i)).fill('Task to Star');
    await page.getByRole('button', { name: /create|add/i }).click();

    await page.waitForTimeout(500);

    // Click star icon on task
    const starButton = page.getByText('Task to Star').locator('..').locator('button[aria-label*="star"]').first();
    await starButton.click();

    // Verify task shows starred state (yellow star)
    await expect(starButton).toHaveClass(/text-yellow/);

    // Click again to unstar
    await starButton.click();

    // Verify star status toggles
    await expect(starButton).not.toHaveClass(/text-yellow/);
  });

  test('task-7: Task detail panel opens', async ({ page }) => {
    // First create a task
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
    await page.getByLabel(/task name|content/i).or(page.getByPlaceholder(/what needs to be done/i)).fill('Task for Detail');
    await page.getByRole('button', { name: /create|add/i }).click();

    await page.waitForTimeout(500);

    // Click on task to open detail panel
    const taskItem = page.getByText('Task for Detail');
    await taskItem.click();

    // Verify panel shows with task details
    const detailPanel = page.locator('[data-testid="task-detail-panel"]');
    await expect(detailPanel).toBeVisible();

    // Verify editable fields are available
    await expect(page.getByLabel(/description|notes/i)).toBeVisible();
  });
});
