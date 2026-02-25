import type { ListAdapter } from '@puratodo/api-types'
import * as listActions from './listActions'

/**
 * SupabaseListAdapter - Implements ListAdapter interface using Supabase Server Actions
 * This adapter is used by the web app to interact with list data
 *
 * Note: This is a plain object with methods that call server actions.
 * Each method delegates to a server action that can be called from client components.
 */
export const SupabaseListAdapter: ListAdapter = {
  createList: listActions.createList,
  getList: listActions.getList,
  updateList: listActions.updateList,
  deleteList: listActions.deleteList,
  getListsByGroup: listActions.getListsByGroup,
  getAllLists: listActions.getAllLists,
  moveList: listActions.moveList,
  reorderLists: listActions.reorderLists,
}
