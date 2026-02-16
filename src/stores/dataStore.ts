import { create } from "zustand";
import { groupsApi, type Group, type CreateGroupInput, type UpdateGroupInput } from "@/lib/api/groups";
import { listsApi, type List, type CreateListInput, type UpdateListInput } from "@/lib/api/lists";

interface DataState {
  groups: Group[];
  lists: List[];
  isLoading: boolean;
  error: string | null;

  // Group actions
  fetchGroups: () => Promise<void>;
  createGroup: (input: CreateGroupInput) => Promise<Group>;
  updateGroup: (id: string, input: UpdateGroupInput) => Promise<Group>;
  deleteGroup: (id: string) => Promise<void>;

  // List actions
  fetchLists: () => Promise<void>;
  createList: (input: CreateListInput) => Promise<List>;
  updateList: (id: string, input: UpdateListInput) => Promise<List>;
  deleteList: (id: string) => Promise<void>;

  // Combined
  fetchAll: () => Promise<void>;
  clear: () => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  groups: [],
  lists: [],
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

  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      await Promise.all([get().fetchGroups(), get().fetchLists()]);
    } finally {
      set({ isLoading: false });
    }
  },

  clear: () => {
    set({ groups: [], lists: [], error: null });
  },
}));
