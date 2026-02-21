import { GroupAdapter } from "@puratodo/api-types";
import { groupsApi } from "../lib/api/groups";
import type { Group, GroupInsert, GroupUpdate } from "@puratodo/api-types";

/**
 * RestGroupAdapter - Implements GroupAdapter interface using REST API
 * This adapter is used by the Tauri app to interact with group data via REST API
 */
export const RestGroupAdapter: GroupAdapter = {
  async createGroup(group: GroupInsert): Promise<Group> {
    return await groupsApi.create({
      name: group.name,
      color: group.color,
    });
  },

  async getGroup(id: string): Promise<Group | null> {
    try {
      const allGroups = await groupsApi.list();
      return allGroups.find(g => g.id === id) || null;
    } catch {
      return null;
    }
  },

  async updateGroup(id: string, updates: GroupUpdate): Promise<Group> {
    return await groupsApi.update(id, updates);
  },

  async deleteGroup(id: string): Promise<void> {
    await groupsApi.delete(id);
  },

  async getAllGroups(): Promise<Group[]> {
    return await groupsApi.list();
  },

  async reorderGroups(groupIds: string[]): Promise<void> {
    if (groupIds.length === 0) return;

    // Update sort_order for each group
    await Promise.all(
      groupIds.map((id, index) =>
        this.updateGroup(id, { sort_order: index })
      )
    );
  },
};
