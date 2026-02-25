import { Skeleton } from '@/components/ui/skeleton'

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
          {[1, 2, 3].map(i => (
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
  )
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
        {[1, 2, 3].map(i => (
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
  )
}

export function TaskPanelSkeleton() {
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
        {[1, 2, 3, 4].map(i => (
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
  )
}
