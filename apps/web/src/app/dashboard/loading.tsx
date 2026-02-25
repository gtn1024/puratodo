import { ListPanelSkeleton, SidebarSkeleton } from '@/components/dashboard/skeletons'

export default function DashboardLoading() {
  return (
    <div className="flex h-screen bg-stone-50 dark:bg-stone-950">
      <SidebarSkeleton />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-stone-200 dark:bg-stone-700 animate-pulse" />
              <div className="h-5 w-32 bg-stone-200 dark:bg-stone-700 rounded animate-pulse" />
            </div>
            <div className="h-8 w-20 bg-stone-200 dark:bg-stone-700 rounded animate-pulse" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <ListPanelSkeleton />
          </div>
        </main>
      </div>
    </div>
  )
}
