'use client'

import { CheckSquare, Key, LayoutDashboard, Menu, Settings, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const settingsNav = [
  {
    label: 'General',
    href: '/dashboard/settings',
    icon: Settings,
  },
  {
    label: 'API Tokens',
    href: '/dashboard/settings/tokens',
    icon: Key,
  },
]

function SettingsSidebar({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <nav className={cn('flex flex-col h-full', className)}>
      <div className="p-4 border-b border-stone-200 dark:border-stone-800">
        <Link href="/dashboard" className="flex items-center gap-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
          <LayoutDashboard className="h-4 w-4" />
          <span className="text-sm">Back to Dashboard</span>
        </Link>
      </div>
      <div className="flex-1 p-2">
        <div className="mb-2 px-2 text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
          Settings
        </div>
        {settingsNav.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
              pathname === item.href
                ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800',
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen bg-stone-50 dark:bg-stone-950">
      <div className="hidden md:block w-64 flex-shrink-0 border-r border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
        <SettingsSidebar />
      </div>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SheetHeader className="sr-only">
            <SheetTitle>Settings Navigation</SheetTitle>
          </SheetHeader>
          <SettingsSidebar />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 md:px-6 py-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8 mr-1"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
              <CheckSquare className="h-4 w-4 text-stone-600 dark:text-stone-400" />
            </div>
            <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              PuraToDo
            </h1>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
