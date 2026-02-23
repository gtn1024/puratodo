import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';
import { translate } from '@/i18n';
import { getLocalDateString } from '@puratodo/shared';

/**
 * Request notification permission from the user
 * Returns true if permission is granted, false otherwise
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    // Check if permission is already granted
    let permissionGranted = await isPermissionGranted();

    // If not, request permission
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === 'granted';
    }

    return permissionGranted;
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
}

/**
 * Send a task reminder notification
 * @param taskName - Name of the task
 * @param taskId - ID of the task (for deep linking in the future)
 * @param dueDate - Due date string (optional, for display)
 */
export async function sendTaskReminder(
  taskName: string,
  taskId: string,
  dueDate?: string
): Promise<boolean> {
  try {
    const permissionGranted = await requestNotificationPermission();

    if (!permissionGranted) {
      console.warn('Notification permission not granted');
      return false;
    }

    // Create notification body with i18n
    let body = `${translate('reminder.task')}: ${taskName}`;
    if (dueDate) {
      body += `\n${translate('reminder.due')}: ${dueDate}`;
    }

    // Send notification with i18n title
    sendNotification({
      title: translate('reminder.notificationTitle'),
      body,
      // Note: icon and sound are optional and platform-specific
    });

    return true;
  } catch (error) {
    console.error('Failed to send notification:', error);
    return false;
  }
}

/**
 * Schedule a reminder for a task at a specific time
 * This is a simple implementation that checks tasks periodically
 * A more robust solution would use a proper scheduler
 * @param tasks - Array of tasks to check for reminders
 */
export function scheduleTaskReminders(
  tasks: Array<{
    id: string;
    name: string;
    due_date: string | null;
    completed: boolean;
  }>
): void {
  // Check tasks every minute
  const checkInterval = 60 * 1000; // 1 minute in milliseconds

  setInterval(async () => {
    const now = new Date();
    const today = getLocalDateString(now);
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight

    for (const task of tasks) {
      // Skip completed tasks
      if (task.completed) continue;

      // Skip tasks without due date
      if (!task.due_date) continue;

      const dueDate = new Date(task.due_date);
      const dueDateStr = getLocalDateString(dueDate);
      const dueTime = dueDate.getHours() * 60 + dueDate.getMinutes();

      // Check if task is due today and within the next hour
      if (dueDateStr === today && dueTime <= currentTime + 60 && dueTime > currentTime) {
        // Send reminder for tasks due within the next hour
        const timeUntilDue = dueTime - currentTime;
        if (timeUntilDue <= 60 && timeUntilDue > 0) {
          await sendTaskReminder(
            task.name,
            task.id,
            dueDate.toLocaleString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })
          );
        }
      }
    }
  }, checkInterval);
}

/**
 * Check if a task is overdue and send a notification
 * @param task - Task to check
 */
export async function notifyOverdueTask(task: {
  id: string;
  name: string;
  due_date: string | null;
  completed: boolean;
}): Promise<void> {
  if (!task.due_date || task.completed) return;

  const dueDate = new Date(task.due_date);
  const now = new Date();

  if (dueDate < now) {
    await sendTaskReminder(
      task.name,
      task.id,
      `${translate('reminder.overdue')}: ${dueDate.toLocaleDateString()}`
    );
  }
}
