import { AdapterProvider } from "@puratodo/task-ui";
import { RestTaskAdapter } from "./RestTaskAdapter";
import { RestListAdapter } from "./RestListAdapter";
import { RestGroupAdapter } from "./RestGroupAdapter";
import type { ReactNode } from "react";

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
  );
}
