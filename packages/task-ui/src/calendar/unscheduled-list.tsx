'use client'

import type { CalendarTask } from './types'
import * as React from 'react'
import { TaskChip } from './task-chip'

export interface UnscheduledTaskListProps {
  tasks: CalendarTask[]
  isLoading?: boolean
  selectedTaskId?: string | null
  onTaskSelect?: (task: CalendarTask) => void
  emptyMessage?: string
  loadingMessage?: string
}

export function UnscheduledTaskList({
  tasks,
  isLoading = false,
  selectedTaskId = null,
  onTaskSelect,
  emptyMessage = 'No unscheduled tasks',
  loadingMessage = 'Loading...',
}: UnscheduledTaskListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">{loadingMessage}</p>
      </div>
    )
  }

  // Empty state
  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  // Task list
  return (
    <div className="flex flex-col gap-1">
      {tasks.map(task => (
        <TaskChip
          key={task.id}
          task={task}
          isSelected={selectedTaskId === task.id}
          onSelect={onTaskSelect}
        />
      ))}
    </div>
  )
}
