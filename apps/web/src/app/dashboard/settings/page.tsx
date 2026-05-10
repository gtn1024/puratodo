import { Key } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
          Settings
        </h1>
        <p className="text-stone-500 dark:text-stone-400 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="space-y-4">
        <Link
          href="/dashboard/settings/tokens"
          className="block p-4 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
              <Key className="h-5 w-5 text-stone-600 dark:text-stone-400" />
            </div>
            <div>
              <h2 className="font-medium text-stone-900 dark:text-stone-100">
                API Tokens
              </h2>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Manage personal access tokens for API authentication
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
