import type { List, ListAdapter, ListInsert, ListUpdate } from '@puratodo/api-types'
import { listsApi } from '../lib/api/lists'

/**
 * RestListAdapter - Implements ListAdapter interface using REST API
 * This adapter is used by the Tauri app to interact with list data via REST API
 */
export const RestListAdapter: ListAdapter = {
  async createList(list: ListInsert): Promise<List> {
    return await listsApi.create({
      group_id: list.group_id,
      name: list.name,
      icon: list.icon,
    })
  },

  async getList(id: string): Promise<List | null> {
    try {
      const allLists = await listsApi.list()
      return allLists.find(l => l.id === id) || null
    }
    catch {
      return null
    }
  },

  async updateList(id: string, updates: ListUpdate): Promise<List> {
    return await listsApi.update(id, updates)
  },

  async deleteList(id: string): Promise<void> {
    await listsApi.delete(id)
  },

  async getListsByGroup(groupId: string): Promise<List[]> {
    const allLists = await listsApi.list()
    return allLists.filter(l => l.group_id === groupId)
  },

  async getAllLists(): Promise<List[]> {
    return await listsApi.list()
  },

  async moveList(listId: string, targetGroupId: string): Promise<List> {
    return await listsApi.move(listId, targetGroupId)
  },

  async reorderLists(listIds: string[]): Promise<void> {
    if (listIds.length === 0)
      return

    // Update sort_order for each list
    await Promise.all(
      listIds.map((id, index) =>
        this.updateList(id, { sort_order: index }),
      ),
    )
  },
}
