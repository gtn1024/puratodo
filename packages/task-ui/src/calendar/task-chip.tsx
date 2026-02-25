'use client'

import type { CalendarTask } from './types'
import { cn } from '@puratodo/ui'
import { CheckCircle2, Circle, Star } from 'lucide-react'
import * as React from 'react'

export interface TaskChipProps {
  task: CalendarTask
  isSelected?: boolean
  onSelect?: (task: CalendarTask) => void
}

export function TaskChip({ task, isSelected, onSelect }: TaskChipProps) {
  const handleClick = () => {
    onSelect?.(task)
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full flex items-center gap-1.5 px-2 py-1 rounded text-xs text-left transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'dark:hover:bg-accent dark:hover:text-accent-foreground',
        isSelected && 'bg-accent text-accent-foreground',
      )}
    >
      {/* Completion status icon */}
      {task.completed
        ? (
            <CheckCircle2 className="h-3 w-3 shrink-0 text-green-600 dark:text-green-400" />
          )
        : (
            <Circle className="h-3 w-3 shrink-0 text-muted-foreground" />
          )}

      {/* Task name */}
      <span className={cn(
        'flex-1 truncate',
        task.completed && 'line-through text-muted-foreground',
      )}
      >
        {task.name}
      </span>

      {/* Star indicator */}
      {task.starred && (
        <Star className="h-3 w-3 shrink-0 fill-yellow-400 text-yellow-400 dark:fill-yellow-500 dark:text-yellow-500" />
      )}
    </button>
  )
}
