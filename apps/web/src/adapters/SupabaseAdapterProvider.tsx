'use client'

import type { ReactNode } from 'react'
import { AdapterProvider } from '@puratodo/task-ui'
import { SupabaseGroupAdapter } from './SupabaseGroupAdapter'
import { SupabaseListAdapter } from './SupabaseListAdapter'
import { SupabaseTaskAdapter } from './SupabaseTaskAdapter'

/**
 * SupabaseAdapterProvider - Provides Supabase adapters to the component tree
 *
 * This component wraps the app with the AdapterProvider from @puratodo/task-ui,
 * providing Supabase-backed implementations of the adapter interfaces.
 *
 * Note: The adapters use Server Actions under the hood, so their methods
 * can be called from client components but execute on the server.
 *
 * Usage:
 * ```tsx
 * <SupabaseAdapterProvider>
 *   <App />
 * </SupabaseAdapterProvider>
 * ```
 */
export function SupabaseAdapterProvider({ children }: { children: ReactNode }) {
  // Adapter objects are stable constants, no need for useMemo
  return (
    <AdapterProvider
      taskAdapter={SupabaseTaskAdapter}
      listAdapter={SupabaseListAdapter}
      groupAdapter={SupabaseGroupAdapter}
    >
      {children}
    </AdapterProvider>
  )
}
