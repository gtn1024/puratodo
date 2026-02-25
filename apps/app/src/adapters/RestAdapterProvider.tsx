import type { ReactNode } from 'react'
import { AdapterProvider } from '@puratodo/task-ui'
import { RestGroupAdapter } from './RestGroupAdapter'
import { RestListAdapter } from './RestListAdapter'
import { RestTaskAdapter } from './RestTaskAdapter'

/**
 * RestAdapterProvider - Provides REST API adapters to the app
 * Wraps the app with AdapterProvider from @puratodo/task-ui
 */
export function RestAdapterProvider({ children }: { children: ReactNode }) {
  return (
    <AdapterProvider
      taskAdapter={RestTaskAdapter}
      listAdapter={RestListAdapter}
      groupAdapter={RestGroupAdapter}
    >
      {children}
    </AdapterProvider>
  )
}
