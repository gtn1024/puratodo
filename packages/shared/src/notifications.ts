/**
 * Notification permission and scheduling utilities for browser notifications.
 * Provides a fallback for environments where service workers are not available.
 */

export type NotificationPermissionState = "granted" | "denied" | "default" | "unsupported";

/**
 * Check if browser notifications are supported
 */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Get current notification permission state
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) {
    return "unsupported";
  }
  return Notification.permission as NotificationPermissionState;
}

/**
 * Request notification permission from the user
 * Returns the permission state after the request
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) {
    return "unsupported";
  }

  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermissionState;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return "denied";
  }
}

/**
 * Show a browser notification
 */
export function showNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (!isNotificationSupported() || Notification.permission !== "granted") {
    return null;
  }

  try {
    const notification = new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      requireInteraction: false,
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  } catch (error) {
    console.error("Error showing notification:", error);
    return null;
  }
}

/**
 * Show a task reminder notification
 */
export function showTaskReminder(
  taskName: string,
  options?: { dueDate?: string; planDate?: string; taskId?: string }
): Notification | null {
  let body = `Reminder: ${taskName}`;

  if (options?.dueDate) {
    body += ` - Due: ${options.dueDate}`;
  } else if (options?.planDate) {
    body += ` - Planned: ${options.planDate}`;
  }

  return showNotification("PuraToDo", {
    body,
    tag: options?.taskId ? `task-reminder-${options.taskId}` : undefined,
  });
}

// Store scheduled timeouts for cleanup
const scheduledTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Schedule a notification at a specific time
 * Returns a cleanup function to cancel the scheduled notification
 */
export function scheduleNotification(
  id: string,
  title: string,
  scheduledTime: Date,
  options?: NotificationOptions
): () => void {
  // Clear any existing scheduled notification with the same ID
  clearScheduledNotification(id);

  const now = new Date();
  const delay = scheduledTime.getTime() - now.getTime();

  if (delay <= 0) {
    // Time has passed, show notification immediately
    showNotification(title, options);
    return () => {};
  }

  const timeoutId = setTimeout(() => {
    showNotification(title, options);
    scheduledTimeouts.delete(id);
  }, delay);

  scheduledTimeouts.set(id, timeoutId);

  return () => clearScheduledNotification(id);
}

/**
 * Clear a scheduled notification
 */
export function clearScheduledNotification(id: string): void {
  const timeoutId = scheduledTimeouts.get(id);
  if (timeoutId) {
    clearTimeout(timeoutId);
    scheduledTimeouts.delete(id);
  }
}

/**
 * Clear all scheduled notifications
 */
export function clearAllScheduledNotifications(): void {
  scheduledTimeouts.forEach((timeoutId) => {
    clearTimeout(timeoutId);
  });
  scheduledTimeouts.clear();
}

/**
 * Schedule a task reminder
 */
export function scheduleTaskReminder(
  taskId: string,
  taskName: string,
  remindAt: Date,
  options?: { dueDate?: string; planDate?: string }
): () => void {
  const body = `Reminder: ${taskName}${
    options?.dueDate ? ` - Due: ${options.dueDate}` : ""
  }${options?.planDate ? ` - Planned: ${options.planDate}` : ""}`;

  return scheduleNotification(`task-${taskId}`, "PuraToDo Reminder", remindAt, {
    body,
    tag: `task-reminder-${taskId}`,
  });
}

/**
 * Parse a date string or Date object to a local datetime string for input[type="datetime-local"]
 */
export function toLocalDateTimeString(date: Date | string | null): string {
  if (!date) return "";

  const d = typeof date === "string" ? new Date(date) : date;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Parse a datetime-local input value to an ISO string for storage
 */
export function fromLocalDateTimeString(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
}

/**
 * Format a reminder time for display
 */
export function formatReminderTime(date: Date | string | null): string {
  if (!date) return "";

  const d = typeof date === "string" ? new Date(date) : date;

  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
