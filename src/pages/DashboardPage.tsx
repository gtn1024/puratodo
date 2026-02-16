import * as React from "react";
import { LogOut, CheckCircle2, Plus, Folder, List, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/authStore";

export function DashboardPage() {
  const { logout } = useAuth();
  const { user } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-50 dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-zinc-900 dark:text-white">
              PuraToDo
            </span>
          </div>
        </div>

        {/* Quick Add */}
        <div className="p-4">
          <button className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium hover:from-violet-500 hover:to-indigo-500 transition-all">
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3">
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
              <CheckCircle2 className="w-5 h-5" />
              <span>Today</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
              <Star className="w-5 h-5" />
              <span>Starred</span>
            </button>
          </div>

          <div className="mt-6">
            <h3 className="px-3 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Groups
            </h3>
            <div className="mt-2 space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                <Folder className="w-5 h-5 text-violet-500" />
                <span>Personal</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                <List className="w-5 h-5 text-blue-500" />
                <span>Work</span>
              </button>
            </div>
          </div>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="text-sm">
                <p className="font-medium text-zinc-900 dark:text-white truncate max-w-24">
                  {user?.name || user?.email?.split("@")[0] || "User"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-700 flex items-center px-6">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Today
          </h1>
        </header>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            {/* Empty state */}
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
              </div>
              <h2 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">
                No tasks yet
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                Get started by creating your first task
              </p>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                <span>Create Task</span>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
