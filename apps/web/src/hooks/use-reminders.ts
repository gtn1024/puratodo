'use client'

import type { Task } from '@/actions/tasks'
import { useCallback, useEffect, useRef } from 'react'
import {
  clearAllScheduledNotifications,
  clearScheduledNotification,
  getNotificationPermission,
  isNotificationSupported,
  scheduleTaskReminder,
  showTaskReminder,
} from '@/lib/notifications'

interface UseRemindersOptions {
  /** Tasks to schedule reminders for */
  tasks: Task[]
  /** Whether reminders are enabled */
  enabled?: boolean
}

/**
 * Hook to manage task reminders in the browser
 */
export function useReminders({ tasks, enabled = true }: UseRemindersOptions) {
  const scheduledRef = useRef<Set<string>>(new Set())
  const cleanupFnsRef = useRef<Map<string, () => void>>(new Map())

  const scheduleReminders = useCallback(() => {
    if (!enabled || !isNotificationSupported() || getNotificationPermission() !== 'granted') {
      return
    }

    const now = new Date()

    for (const task of tasks) {
      // Skip if no reminder set or already completed
      if (!task.remind_at || task.completed) {
        // Clear any existing reminder for this task
        if (cleanupFnsRef.current.has(task.id)) {
          cleanupFnsRef.current.get(task.id)?.()
          cleanupFnsRef.current.delete(task.id)
          scheduledRef.current.delete(task.id)
        }
        continue
      }

      const remindAt = new Date(task.remind_at)

      // Skip if reminder time has passed
      if (remindAt <= now) {
        // Check if we haven't shown the reminder yet
        if (!task.reminder_sent_at && !scheduledRef.current.has(task.id)) {
          showTaskReminder(task.name, {
            dueDate: task.due_date || undefined,
            planDate: task.plan_date || undefined,
            taskId: task.id,
          })
          scheduledRef.current.add(task.id)
        }
        continue
      }

      // Skip if already scheduled
      if (cleanupFnsRef.current.has(task.id)) {
        continue
      }

      // Schedule the reminder
      const cleanup = scheduleTaskReminder(task.id, task.name, remindAt, {
        dueDate: task.due_date || undefined,
        planDate: task.plan_date || undefined,
      })

      cleanupFnsRef.current.set(task.id, cleanup)
      scheduledRef.current.add(task.id)
    }

    // Clean up reminders for tasks that are no longer in the list
    const currentTaskIds = new Set(tasks.map(t => t.id))
    for (const [taskId, cleanup] of cleanupFnsRef.current) {
      if (!currentTaskIds.has(taskId)) {
        cleanup()
        cleanupFnsRef.current.delete(taskId)
        scheduledRef.current.delete(taskId)
      }
    }
  }, [tasks, enabled])

  // Schedule reminders when tasks change
  useEffect(() => {
    scheduleReminders()

    // Cleanup on unmount
    return () => {
      clearAllScheduledNotifications()
      cleanupFnsRef.current.clear()
      scheduledRef.current.clear()
    }
  }, [scheduleReminders])

  // Clear a specific reminder
  const clearReminder = useCallback((taskId: string) => {
    if (cleanupFnsRef.current.has(taskId)) {
      cleanupFnsRef.current.get(taskId)?.()
      cleanupFnsRef.current.delete(taskId)
      scheduledRef.current.delete(taskId)
    }
    clearScheduledNotification(`task-${taskId}`)
  }, [])

  // Clear all reminders
  const clearAllReminders = useCallback(() => {
    clearAllScheduledNotifications()
    cleanupFnsRef.current.forEach(cleanup => cleanup())
    cleanupFnsRef.current.clear()
    scheduledRef.current.clear()
  }, [])

  return {
    clearReminder,
    clearAllReminders,
    scheduleReminders,
  }
}
