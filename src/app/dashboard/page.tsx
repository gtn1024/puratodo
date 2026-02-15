import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LogoutButton } from "./logout-button";
import { Sidebar } from "@/components/dashboard/sidebar";
import { getGroups } from "@/actions/groups";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const groups = await getGroups();

  return (
    <div className="flex h-screen bg-stone-50 dark:bg-stone-950">
      <Sidebar initialGroups={groups} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-stone-500 dark:text-stone-400">
                {user.email}
              </span>
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {groups.length === 0 ? (
              <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-stone-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
                  Welcome to PuraToDo
                </h2>
                <p className="text-stone-500 dark:text-stone-400 mb-6">
                  Create a group to get started organizing your tasks
                </p>
                <p className="text-sm text-stone-400 dark:text-stone-500">
                  Click the + button in the sidebar to create your first group
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-stone-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
                  No list selected
                </h2>
                <p className="text-stone-500 dark:text-stone-400">
                  Select a list from the sidebar to view tasks
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
