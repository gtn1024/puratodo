import * as React from "react";
import { Skeleton } from "@puratodo/ui";

/**
 * LoadingState Component
 *
 * Displays a loading state with skeleton placeholders.
 * Used when data is being fetched or loaded.
 */

export interface LoadingStateProps {
  /**
   * Type of loading state to display
   * - "generic": Simple centered spinner/skeleton
   * - "list": List of skeleton items
   * - "card": Card-based skeleton
   * - "sidebar": Sidebar skeleton with groups
   */
  type?: "generic" | "list" | "card" | "sidebar";

  /**
   * Number of skeleton items to display (for list type)
   * @default 3
   */
  count?: number;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export function LoadingState({
  type = "generic",
  count = 3,
  className = "",
}: LoadingStateProps) {
  if (type === "generic") {
    return (
      <div className={`py-12 text-center ${className}`}>
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center animate-pulse">
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    );
  }

  if (type === "list") {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-800"
          >
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-6 w-6 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "card") {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-lg border border-stone-200 dark:border-stone-800"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "sidebar") {
    return (
      <aside className={`w-64 h-screen bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex flex-col ${className}`}>
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>

        {/* Groups Section */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="flex items-center justify-between px-2 py-1.5 mb-1">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-5 w-5 rounded" />
          </div>

          {/* Group Items */}
          <div className="space-y-0.5">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="px-2 py-1.5">
                <div className="flex items-center gap-1">
                  <Skeleton className="h-3.5 w-3.5 rounded" />
                  <Skeleton className="h-3.5 w-3.5 rounded" />
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  return null;
}

/**
 * Specialized Skeleton Components
 *
 * Pre-configured skeleton layouts for common use cases
 */

export function TaskListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="text-xl w-6 h-6" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      {/* New Task Input */}
      <div className="flex items-center gap-2 px-3 py-2 border border-stone-200 dark:border-stone-800 rounded-lg">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 flex-1" />
      </div>

      {/* Task Items */}
      <div className="space-y-1">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-stone-200 dark:border-stone-800"
          >
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-6 w-6 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListPanelSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      {/* List Items */}
      <div className="space-y-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-800"
          >
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="text-xl w-6 h-6" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-6 w-6 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <aside className="w-64 h-screen bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>

      {/* Groups Section */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex items-center justify-between px-2 py-1.5 mb-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-5 w-5 rounded" />
        </div>

        {/* Group Items */}
        <div className="space-y-0.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-2 py-1.5">
              <div className="flex items-center gap-1">
                <Skeleton className="h-3.5 w-3.5 rounded" />
                <Skeleton className="h-3.5 w-3.5 rounded" />
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 flex-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
