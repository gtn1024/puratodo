"use client";

import { useState, useCallback } from "react";
import { Button } from "@puratodo/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@puratodo/ui";
import { Filter } from "lucide-react";

// Filter types
export type StatusFilter = "all" | "completed" | "incomplete";
export type StarFilter = "all" | "starred" | "unstarred";
export type DateFilter = "all" | "overdue" | "today" | "upcoming" | "nodate";

export interface TaskFiltersValue {
  status: StatusFilter;
  star: StarFilter;
  date: DateFilter;
}

export interface TaskFiltersProps {
  value: TaskFiltersValue;
  onChange: (filters: TaskFiltersValue) => void;
  labels: {
    all: string;
    incomplete: string;
    completed: string;
    starred: string;
    unstarred: string;
    dueDate: string;
    overdue: string;
    today: string;
    upcoming: string;
    noDueDate: string;
    clearFilters: string;
    filter: string;
  };
}

export function TaskFilters({ value, onChange, labels }: TaskFiltersProps) {
  const hasActiveFilters =
    value.status !== "all" || value.star !== "all" || value.date !== "all";

  const activeFilterCount = [value.status, value.star, value.date].filter(
    (f) => f !== "all"
  ).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={hasActiveFilters ? "border-stone-400 dark:border-stone-600" : ""}
        >
          <Filter className="h-4 w-4 mr-1" />
          {labels.filter}
          {hasActiveFilters && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-stone-200 dark:bg-stone-700 rounded">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* Status Filter */}
        <div className="px-2 py-1.5 text-xs font-semibold text-stone-500 dark:text-stone-400">
          Status
        </div>
        <DropdownMenuItem
          onClick={() => onChange({ ...value, status: "all" })}
          className={value.status === "all" ? "bg-stone-100 dark:bg-stone-800" : ""}
        >
          {labels.all}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onChange({ ...value, status: "incomplete" })}
          className={value.status === "incomplete" ? "bg-stone-100 dark:bg-stone-800" : ""}
        >
          {labels.incomplete}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onChange({ ...value, status: "completed" })}
          className={value.status === "completed" ? "bg-stone-100 dark:bg-stone-800" : ""}
        >
          {labels.completed}
        </DropdownMenuItem>

        {/* Star Filter */}
        <div className="px-2 py-1.5 text-xs font-semibold text-stone-500 dark:text-stone-400 mt-1">
          {labels.starred}
        </div>
        <DropdownMenuItem
          onClick={() => onChange({ ...value, star: "all" })}
          className={value.star === "all" ? "bg-stone-100 dark:bg-stone-800" : ""}
        >
          {labels.all}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onChange({ ...value, star: "starred" })}
          className={value.star === "starred" ? "bg-stone-100 dark:bg-stone-800" : ""}
        >
          {labels.starred}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onChange({ ...value, star: "unstarred" })}
          className={value.star === "unstarred" ? "bg-stone-100 dark:bg-stone-800" : ""}
        >
          {labels.unstarred}
        </DropdownMenuItem>

        {/* Date Filter */}
        <div className="px-2 py-1.5 text-xs font-semibold text-stone-500 dark:text-stone-400 mt-1">
          {labels.dueDate}
        </div>
        <DropdownMenuItem
          onClick={() => onChange({ ...value, date: "all" })}
          className={value.date === "all" ? "bg-stone-100 dark:bg-stone-800" : ""}
        >
          {labels.all}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onChange({ ...value, date: "overdue" })}
          className={value.date === "overdue" ? "bg-stone-100 dark:bg-stone-800" : ""}
        >
          {labels.overdue}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onChange({ ...value, date: "today" })}
          className={value.date === "today" ? "bg-stone-100 dark:bg-stone-800" : ""}
        >
          {labels.today}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onChange({ ...value, date: "upcoming" })}
          className={value.date === "upcoming" ? "bg-stone-100 dark:bg-stone-800" : ""}
        >
          {labels.upcoming}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onChange({ ...value, date: "nodate" })}
          className={value.date === "nodate" ? "bg-stone-100 dark:bg-stone-800" : ""}
        >
          {labels.noDueDate}
        </DropdownMenuItem>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="border-t border-stone-200 dark:border-stone-700 mt-1 pt-1">
            <DropdownMenuItem
              onClick={() =>
                onChange({ status: "all", star: "all", date: "all" })
              }
              className="text-red-600 dark:text-red-400"
            >
              {labels.clearFilters}
            </DropdownMenuItem>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Helper function to filter tasks based on current filters
export function filterTasksByFilterValue<T extends {
  completed: boolean;
  starred: boolean;
  due_date: string | null;
  subtasks?: T[];
}>(taskList: T[], filters: TaskFiltersValue): T[] {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  const matchesFilter = (task: T): boolean => {
    // Status filter
    if (filters.status === "completed" && !task.completed) return false;
    if (filters.status === "incomplete" && task.completed) return false;

    // Star filter
    if (filters.star === "starred" && !task.starred) return false;
    if (filters.star === "unstarred" && task.starred) return false;

    // Date filter
    if (filters.date === "overdue") {
      if (!task.due_date || task.completed) return false;
      if (task.due_date >= todayStr) return false;
    }
    if (filters.date === "today") {
      if (!task.due_date) return false;
      if (task.due_date !== todayStr) return false;
    }
    if (filters.date === "upcoming") {
      if (!task.due_date || task.completed) return false;
      if (task.due_date <= todayStr) return false;
    }
    if (filters.date === "nodate" && task.due_date) return false;

    return true;
  };

  return taskList.filter(matchesFilter).map((task) => ({
    ...task,
    subtasks: task.subtasks ? filterTasksByFilterValue(task.subtasks, filters) : [],
  }));
}

// Check if any filter is active
export function hasActiveFilterValues(filters: TaskFiltersValue): boolean {
  return filters.status !== "all" || filters.star !== "all" || filters.date !== "all";
}
