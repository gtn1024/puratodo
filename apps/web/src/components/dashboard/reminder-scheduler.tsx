'use client'

import type { Task } from '@/actions/tasks'
import { useCallback, useEffect, useRef } from 'react'
import { useReminders } from '@/hooks/use-reminders'
import { createClient } from '@/lib/supabase/client'

interface ReminderSchedulerProps {
  /** Whether to enable reminders */
  enabled?: boolean
}

/**
 * Component that schedules task reminders in the background.
 * This should be mounted once in the dashboard to handle all reminders.
 */
export function ReminderScheduler({ enabled = true }: ReminderSchedulerProps) {
  const tasksRef = useRef<Task[]>([])
  const { scheduleReminders, clearAllReminders } = useReminders({
    tasks: tasksRef.current,
    enabled,
  })

  // Fetch tasks with reminders
  const fetchTasksWithReminders = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return
    }

    // Fetch tasks that have reminders and are not completed
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', false)
      .not('remind_at', 'is', null)

    if (error) {
      console.error('Error fetching tasks with reminders:', error)
      return
    }

    tasksRef.current = (tasks as Task[]) || []
    scheduleReminders()
  }, [scheduleReminders])

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchTasksWithReminders()
    }
    else {
      clearAllReminders()
    }
  }, [enabled, fetchTasksWithReminders, clearAllReminders])

  // Set up realtime subscription for task changes
  useEffect(() => {
    if (!enabled)
      return

    const supabase = createClient()
    const channel = supabase
      .channel('reminder-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        () => {
          // Refetch tasks when any task changes
          fetchTasksWithReminders()
        },
      )
      .subscribe()

    // Refresh reminders every minute to handle time-based changes
    const interval = setInterval(fetchTasksWithReminders, 60000)

    return () => {
      channel.unsubscribe()
      clearInterval(interval)
    }
  }, [enabled, fetchTasksWithReminders])

  // This component doesn't render anything
  return null
}
