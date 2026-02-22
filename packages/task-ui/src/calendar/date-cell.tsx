"use client";

import React from "react";
import { cn } from "@puratodo/ui";
import { TaskChip } from "./task-chip";
import type { CalendarTask } from "./types";

export interface DateCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: CalendarTask[];
  selectedTaskId?: string;
  onTaskSelect?: (task: CalendarTask) => void;
  maxVisibleTasks?: number;
}

export function DateCell({
  date,
  isCurrentMonth,
  isToday,
  tasks,
  selectedTaskId,
  onTaskSelect,
  maxVisibleTasks = 3,
}: DateCellProps) {
  const visibleTasks = tasks.slice(0, maxVisibleTasks);
  const hiddenTaskCount = tasks.length - maxVisibleTasks;
  const hasHiddenTasks = hiddenTaskCount > 0;

  return (
    <div
      className={cn(
        "min-h-[100px] border-r border-b p-1.5 flex flex-col",
        "border-border dark:border-border",
        !isCurrentMonth && "bg-muted/30 dark:bg-muted/10"
      )}
    >
      {/* Date number */}
      <div
        className={cn(
          "text-sm font-medium mb-1 h-6 w-6 flex items-center justify-center rounded-full",
          isToday && "bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground",
          !isToday && isCurrentMonth && "text-foreground dark:text-foreground",
          !isToday && !isCurrentMonth && "text-muted-foreground dark:text-muted-foreground"
        )}
      >
        {date.getDate()}
      </div>

      {/* Tasks */}
      <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
        {visibleTasks.map((task) => (
          <TaskChip
            key={task.id}
            task={task}
            isSelected={selectedTaskId === task.id}
            onSelect={onTaskSelect}
          />
        ))}

        {/* +N more indicator */}
        {hasHiddenTasks && (
          <div className="text-xs text-muted-foreground dark:text-muted-foreground px-2 py-0.5">
            +{hiddenTaskCount} more
          </div>
        )}
      </div>
    </div>
  );
}
