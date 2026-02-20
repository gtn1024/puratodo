import { create } from "zustand";
import { groupsApi, type Group, type CreateGroupInput, type UpdateGroupInput } from "@/lib/api/groups";
import { listsApi, type List, type CreateListInput, type UpdateListInput } from "@/lib/api/lists";
import { tasksApi, type Task } from "@/lib/api/tasks";

interface DataState {
  groups: Group[];
  lists: List[];
  tasks: Task[];
  isLoading: boolean;
  error: string | null;

  // Group actions
  fetchGroups: () => Promise<void>;
  createGroup: (input: CreateGroupInput) => Promise<Group>;
  updateGroup: (id: string, input: UpdateGroupInput) => Promise<Group>;
  reorderGroups: (orderedGroupIds: string[]) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;

  // List actions
  fetchLists: () => Promise<void>;
  createList: (input: CreateListInput) => Promise<List>;
  updateList: (id: string, input: UpdateListInput) => Promise<List>;
  moveList: (id: string, group_id: string) => Promise<List>;
  reorderLists: (orderedListIds: string[]) => Promise<void>;
  deleteList: (id: string) => Promise<void>;

  // Task actions
  fetchTasks: () => Promise<void>;

  // Combined
  fetchAll: () => Promise<void>;
  clear: () => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  groups: [],
  lists: [],
  tasks: [],
  isLoading: false,
  error: null,

  fetchGroups: async () => {
    try {
      const groups = await groupsApi.list();
      // Sort by sort_order
      groups.sort((a, b) => a.sort_order - b.sort_order);
      set({ groups, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch groups";
      set({ error: message });
      throw error;
    }
  },

  createGroup: async (input) => {
    try {
      const group = await groupsApi.create(input);
      const groups = [...get().groups, group];
      groups.sort((a, b) => a.sort_order - b.sort_order);
      set({ groups, error: null });
      return group;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create group";
      set({ error: message });
      throw error;
    }
  },

  updateGroup: async (id, input) => {
    try {
      const updatedGroup = await groupsApi.update(id, input);
      const groups = get().groups.map((g) => (g.id === id ? updatedGroup : g));
      groups.sort((a, b) => a.sort_order - b.sort_order);
      set({ groups, error: null });
      return updatedGroup;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update group";
      set({ error: message });
      throw error;
    }
  },

  reorderGroups: async (orderedGroupIds) => {
    const previousGroups = [...get().groups];
    if (previousGroups.length <= 1) return;

    const groupMap = new Map(previousGroups.map((group) => [group.id, group]));
    const reorderedGroups = orderedGroupIds
      .map((groupId) => groupMap.get(groupId))
      .filter((group): group is Group => Boolean(group));

    if (reorderedGroups.length !== previousGroups.length) return;

    const minSortOrder = previousGroups.reduce(
      (min, group) => Math.min(min, group.sort_order),
      previousGroups[0]?.sort_order ?? 0,
    );

    const nextGroups = reorderedGroups.map((group, index) => ({
      ...group,
      sort_order: minSortOrder + index,
    }));

    const changedGroups = nextGroups.filter((group) => {
      const previous = groupMap.get(group.id);
      return previous ? previous.sort_order !== group.sort_order : false;
    });

    if (changedGroups.length === 0) return;

    set({ groups: nextGroups, error: null });

    try {
      const updatedGroups = await Promise.all(
        changedGroups.map((group) =>
          groupsApi.update(group.id, { sort_order: group.sort_order }),
        ),
      );

      const updatedMap = new Map(updatedGroups.map((group) => [group.id, group]));
      const mergedGroups = nextGroups.map((group) => updatedMap.get(group.id) ?? group);
      mergedGroups.sort((a, b) => a.sort_order - b.sort_order);
      set({ groups: mergedGroups, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reorder groups";
      set({ groups: previousGroups, error: message });
      throw error;
    }
  },

  deleteGroup: async (id) => {
    try {
      await groupsApi.delete(id);
      const groups = get().groups.filter((g) => g.id !== id);
      const lists = get().lists.filter((l) => l.group_id !== id);
      set({ groups, lists, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete group";
      set({ error: message });
      throw error;
    }
  },

  fetchLists: async () => {
    try {
      const lists = await listsApi.list();
      // Sort by sort_order
      lists.sort((a, b) => a.sort_order - b.sort_order);
      set({ lists, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch lists";
      set({ error: message });
      throw error;
    }
  },

  createList: async (input) => {
    try {
      const list = await listsApi.create(input);
      const lists = [...get().lists, list];
      lists.sort((a, b) => a.sort_order - b.sort_order);
      set({ lists, error: null });
      return list;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create list";
      set({ error: message });
      throw error;
    }
  },

  updateList: async (id, input) => {
    try {
      const updatedList = await listsApi.update(id, input);
      const lists = get().lists.map((l) => (l.id === id ? updatedList : l));
      lists.sort((a, b) => a.sort_order - b.sort_order);
      set({ lists, error: null });
      return updatedList;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update list";
      set({ error: message });
      throw error;
    }
  },

  moveList: async (id, group_id) => {
    try {
      const updatedList = await listsApi.move(id, group_id);
      const lists = get().lists.map((l) => (l.id === id ? updatedList : l));
      lists.sort((a, b) => a.sort_order - b.sort_order);
      set({ lists, error: null });
      return updatedList;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to move list";
      set({ error: message });
      throw error;
    }
  },

  reorderLists: async (orderedListIds) => {
    const previousLists = [...get().lists];
    if (previousLists.length <= 1) return;

    const listMap = new Map(previousLists.map((list) => [list.id, list]));
    const reorderedLists = orderedListIds
      .map((listId) => listMap.get(listId))
      .filter((list): list is List => Boolean(list));

    if (reorderedLists.length !== orderedListIds.length) return;

    // Calculate new sort_order values based on position
    const minSortOrder = reorderedLists.reduce(
      (min, list) => Math.min(min, list.sort_order),
      reorderedLists[0]?.sort_order ?? 0,
    );

    const nextLists = reorderedLists.map((list, index) => ({
      ...list,
      sort_order: minSortOrder + index,
    }));

    const changedLists = nextLists.filter((list) => {
      const previous = listMap.get(list.id);
      return previous ? previous.sort_order !== list.sort_order : false;
    });

    if (changedLists.length === 0) return;

    // Optimistic update
    const allLists = get().lists.map((list) => {
      const updated = nextLists.find((l) => l.id === list.id);
      return updated ?? list;
    });
    allLists.sort((a, b) => a.sort_order - b.sort_order);
    set({ lists: allLists, error: null });

    try {
      const updatedLists = await Promise.all(
        changedLists.map((list) =>
          listsApi.update(list.id, { name: list.name, sort_order: list.sort_order }),
        ),
      );

      const updatedMap = new Map(updatedLists.map((list) => [list.id, list]));
      const mergedLists = get().lists.map((list) => updatedMap.get(list.id) ?? list);
      mergedLists.sort((a, b) => a.sort_order - b.sort_order);
      set({ lists: mergedLists, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reorder lists";
      set({ lists: previousLists, error: message });
      throw error;
    }
  },

  deleteList: async (id) => {
    try {
      await listsApi.delete(id);
      const lists = get().lists.filter((l) => l.id !== id);
      set({ lists, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete list";
      set({ error: message });
      throw error;
    }
  },

  fetchTasks: async () => {
    try {
      const tasks = await tasksApi.list();
      // Sort by list first, then within a list by sort_order
      tasks.sort((a, b) => {
        if (a.list_id === b.list_id) {
          return a.sort_order - b.sort_order;
        }
        return a.list_id.localeCompare(b.list_id);
      });
      set({ tasks, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch tasks";
      set({ error: message });
      throw error;
    }
  },

  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      await Promise.all([get().fetchGroups(), get().fetchLists()]);
    } finally {
      set({ isLoading: false });
    }
  },

  clear: () => {
    set({ groups: [], lists: [], tasks: [], error: null });
  },
}));
