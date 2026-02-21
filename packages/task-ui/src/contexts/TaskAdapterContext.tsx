'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { TaskAdapter, ListAdapter, GroupAdapter } from '@puratodo/api-types';

/**
 * AdapterContextValue - The value provided by the AdapterProvider
 */
interface AdapterContextValue {
  taskAdapter: TaskAdapter;
  listAdapter: ListAdapter;
  groupAdapter: GroupAdapter;
}

/**
 * AdapterContext - React Context for providing adapters to components
 */
const AdapterContext = createContext<AdapterContextValue | null>(null);

/**
 * AdapterProvider Props
 */
interface AdapterProviderProps {
  taskAdapter: TaskAdapter;
  listAdapter: ListAdapter;
  groupAdapter: GroupAdapter;
  children: ReactNode;
}

/**
 * AdapterProvider - Provides adapters to all child components via React Context
 *
 * Usage:
 * ```tsx
 * <AdapterProvider
 *   taskAdapter={supabaseTaskAdapter}
 *   listAdapter={supabaseListAdapter}
 *   groupAdapter={supabaseGroupAdapter}
 * >
 *   <App />
 * </AdapterProvider>
 * ```
 */
export function AdapterProvider({
  taskAdapter,
  listAdapter,
  groupAdapter,
  children,
}: AdapterProviderProps) {
  const value: AdapterContextValue = {
    taskAdapter,
    listAdapter,
    groupAdapter,
  };

  return (
    <AdapterContext.Provider value={value}>
      {children}
    </AdapterContext.Provider>
  );
}

/**
 * useTaskAdapter - Hook to access the TaskAdapter from context
 *
 * @throws Error if used outside of AdapterProvider
 * @returns TaskAdapter instance
 *
 * Usage:
 * ```tsx
 * const taskAdapter = useTaskAdapter();
 * const tasks = await taskAdapter.getTasksByList(listId);
 * ```
 */
export function useTaskAdapter(): TaskAdapter {
  const context = useContext(AdapterContext);
  if (!context) {
    throw new Error('useTaskAdapter must be used within an AdapterProvider');
  }
  return context.taskAdapter;
}

/**
 * useListAdapter - Hook to access the ListAdapter from context
 *
 * @throws Error if used outside of AdapterProvider
 * @returns ListAdapter instance
 */
export function useListAdapter(): ListAdapter {
  const context = useContext(AdapterContext);
  if (!context) {
    throw new Error('useListAdapter must be used within an AdapterProvider');
  }
  return context.listAdapter;
}

/**
 * useGroupAdapter - Hook to access the GroupAdapter from context
 *
 * @throws Error if used outside of AdapterProvider
 * @returns GroupAdapter instance
 */
export function useGroupAdapter(): GroupAdapter {
  const context = useContext(AdapterContext);
  if (!context) {
    throw new Error('useGroupAdapter must be used within an AdapterProvider');
  }
  return context.groupAdapter;
}

/**
 * useAdapters - Hook to access all adapters from context
 *
 * @throws Error if used outside of AdapterProvider
 * @returns Object with all adapters
 *
 * Usage:
 * ```tsx
 * const { taskAdapter, listAdapter, groupAdapter } = useAdapters();
 * ```
 */
export function useAdapters(): AdapterContextValue {
  const context = useContext(AdapterContext);
  if (!context) {
    throw new Error('useAdapters must be used within an AdapterProvider');
  }
  return context;
}
