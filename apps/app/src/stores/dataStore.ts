import { create } from "zustand";
import { groupsApi, type Group, type CreateGroupInput, type UpdateGroupInput } from "@/lib/api/groups";
import { listsApi, type List, type CreateListInput, type UpdateListInput } from "@/lib/api/lists";
import { tasksApi, type Task, type CreateTaskInput, type UpdateTaskInput } from "@/lib/api/tasks";
import { translate } from "@/i18n";

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
  createTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, input: UpdateTaskInput) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, list_id: string) => Promise<Task>;
  reorderTasks: (orderedTaskIds: string[]) => Promise<void>;

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
      const message = error instanceof Error ? error.message : translate("errors.fetchGroupsFailed");
      set({ error: message });
      throw error;
    }
  },

  createGroup: async (input) => {
    // Optimistic: create temp group
    const tempId = `temp-${Date.now()}`;
    const optimisticGroup: Group = {
      id: tempId,
      name: input.name,
      color: input.color ?? null,
      sort_order: input.sort_order ?? 0,
      created_at: new Date().toISOString(),
      user_id: "",
    };

    const previousGroups = [...get().groups];
    const groups = [...previousGroups, optimisticGroup];
    groups.sort((a, b) => a.sort_order - b.sort_order);
    set({ groups, error: null });

    try {
      const group = await groupsApi.create(input);
      // Replace temp group with real one
      const updatedGroups = get()
        .groups.map((g) => (g.id === tempId ? group : g))
        .sort((a, b) => a.sort_order - b.sort_order);
      set({ groups: updatedGroups, error: null });
      return group;
    } catch (error) {
      const message = error instanceof Error ? error.message : translate("errors.createGroupFailed");
      // Rollback: remove temp group
      set({ groups: previousGroups, error: message });
      throw error;
    }
  },

  updateGroup: async (id, input) => {
    const previousGroups = [...get().groups];

    // Optimistic: update group immediately
    const optimisticGroups = previousGroups.map((g) =>
      g.id === id ? { ...g, ...input } : g
    );
    optimisticGroups.sort((a, b) => a.sort_order - b.sort_order);
    set({ groups: optimisticGroups, error: null });

    try {
      const updatedGroup = await groupsApi.update(id, input);
      const groups = get()
        .groups.map((g) => (g.id === id ? updatedGroup : g))
        .sort((a, b) => a.sort_order - b.sort_order);
      set({ groups, error: null });
      return updatedGroup;
    } catch (error) {
      const message = error instanceof Error ? error.message : translate("errors.updateGroupFailed");
      // Rollback: restore previous groups
      set({ groups: previousGroups, error: message });
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
      const message = error instanceof Error ? error.message : translate("errors.reorderGroupsFailed");
      set({ groups: previousGroups, error: message });
      throw error;
    }
  },

  deleteGroup: async (id) => {
    // Save previous state for rollback
    const previousGroups = [...get().groups];
    const previousLists = [...get().lists];
    const previousTasks = [...get().tasks];

    // Get IDs of lists to be deleted
    const listIdsToDelete = previousLists
      .filter((l) => l.group_id === id)
      .map((l) => l.id);

    // Optimistic: remove group, associated lists, and tasks
    const groups = previousGroups.filter((g) => g.id !== id);
    const lists = previousLists.filter((l) => l.group_id !== id);
    const tasks = previousTasks.filter((t) => !listIdsToDelete.includes(t.list_id));
    set({ groups, lists, tasks, error: null });

    try {
      await groupsApi.delete(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : translate("errors.deleteGroupFailed");
      // Rollback: restore all deleted items
      set({ groups: previousGroups, lists: previousLists, tasks: previousTasks, error: message });
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
      const message = error instanceof Error ? error.message : translate("errors.fetchListsFailed");
      set({ error: message });
      throw error;
    }
  },

  createList: async (input) => {
    // Optimistic: create temp list
    const tempId = `temp-${Date.now()}`;
    const optimisticList: List = {
      id: tempId,
      name: input.name,
      group_id: input.group_id,
      icon: input.icon ?? null,
      sort_order: input.sort_order ?? 0,
      created_at: new Date().toISOString(),
      user_id: "",
    };

    const previousLists = [...get().lists];
    const lists = [...previousLists, optimisticList];
    lists.sort((a, b) => a.sort_order - b.sort_order);
    set({ lists, error: null });

    try {
      const list = await listsApi.create(input);
      // Replace temp list with real one
      const updatedLists = get()
        .lists.map((l) => (l.id === tempId ? list : l))
        .sort((a, b) => a.sort_order - b.sort_order);
      set({ lists: updatedLists, error: null });
      return list;
    } catch (error) {
      const message = error instanceof Error ? error.message : translate("errors.createListFailed");
      // Rollback: remove temp list
      set({ lists: previousLists, error: message });
      throw error;
    }
  },

  updateList: async (id, input) => {
    const previousLists = [...get().lists];

    // Optimistic: update list immediately
    const optimisticLists = previousLists.map((l) =>
      l.id === id ? { ...l, ...input } : l
    );
    optimisticLists.sort((a, b) => a.sort_order - b.sort_order);
    set({ lists: optimisticLists, error: null });

    try {
      const updatedList = await listsApi.update(id, input);
      const lists = get()
        .lists.map((l) => (l.id === id ? updatedList : l))
        .sort((a, b) => a.sort_order - b.sort_order);
      set({ lists, error: null });
      return updatedList;
    } catch (error) {
      const message = error instanceof Error ? error.message : translate("errors.updateListFailed");
      // Rollback: restore previous lists
      set({ lists: previousLists, error: message });
      throw error;
    }
  },

  moveList: async (id, group_id) => {
    const previousLists = [...get().lists];

    // Optimistic: move list to new group immediately
    const optimisticLists = previousLists.map((l) =>
      l.id === id ? { ...l, group_id } : l
    );
    optimisticLists.sort((a, b) => a.sort_order - b.sort_order);
    set({ lists: optimisticLists, error: null });

    try {
      const updatedList = await listsApi.move(id, group_id);
      const lists = get()
        .lists.map((l) => (l.id === id ? updatedList : l))
        .sort((a, b) => a.sort_order - b.sort_order);
      set({ lists, error: null });
      return updatedList;
    } catch (error) {
      const message = error instanceof Error ? error.message : translate("errors.moveListFailed");
      // Rollback: restore previous lists
      set({ lists: previousLists, error: message });
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
      const message = error instanceof Error ? error.message : translate("errors.reorderListsFailed");
      set({ lists: previousLists, error: message });
      throw error;
    }
  },

  deleteList: async (id) => {
    // Save previous state for rollback
    const previousLists = [...get().lists];
    const previousTasks = [...get().tasks];

    // Optimistic: remove list and associated tasks
    const lists = previousLists.filter((l) => l.id !== id);
    const tasks = previousTasks.filter((t) => t.list_id !== id);
    set({ lists, tasks, error: null });

    try {
      await listsApi.delete(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : translate("errors.deleteListFailed");
      // Rollback: restore list and tasks
      set({ lists: previousLists, tasks: previousTasks, error: message });
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
      const message = error instanceof Error ? error.message : translate("errors.fetchTasksFailed");
      set({ error: message });
      throw error;
    }
  },

  createTask: async (input) => {
    // Optimistic: create temp task
    const tempId = `temp-${Date.now()}`;
    const optimisticTask: Task = {
      id: tempId,
      name: input.name,
      list_id: input.list_id,
      parent_id: input.parent_id ?? null,
      completed: input.completed ?? false,
      starred: input.starred ?? false,
      due_date: input.due_date ?? null,
      plan_date: input.plan_date ?? null,
      comment: input.comment ?? null,
      duration_minutes: input.duration_minutes ?? null,
      sort_order: input.sort_order ?? 0,
      created_at: new Date().toISOString(),
      user_id: "",
    };

    const previousTasks = [...get().tasks];
    const tasks = [...previousTasks, optimisticTask];
    set({ tasks, error: null });

    try {
      const newTask = await tasksApi.create(input);
      // Replace temp task with real one
      const updatedTasks = get().tasks.map((t) => (t.id === tempId ? newTask : t));
      set({ tasks: updatedTasks, error: null });
      return newTask;
    } catch (error) {
      const message = error instanceof Error ? error.message : translate("errors.createTaskFailed");
      // Rollback: remove temp task
      set({ tasks: previousTasks, error: message });
      throw error;
    }
  },

  updateTask: async (id, input) => {
    const previousTasks = [...get().tasks];

    // Optimistic: update task immediately
    const optimisticTasks = previousTasks.map((t) =>
      t.id === id ? { ...t, ...input } : t
    );
    set({ tasks: optimisticTasks, error: null });

    try {
      const updatedTask = await tasksApi.update(id, input);
      const tasks = get().tasks.map((t) => (t.id === id ? updatedTask : t));
      set({ tasks, error: null });
      return updatedTask;
    } catch (error) {
      const message = error instanceof Error ? error.message : translate("errors.updateTaskFailed");
      // Rollback: restore previous tasks
      set({ tasks: previousTasks, error: message });
      throw error;
    }
  },

  deleteTask: async (id) => {
    const previousTasks = [...get().tasks];

    // Optimistic: remove task immediately
    const tasks = previousTasks.filter((t) => t.id !== id);
    set({ tasks, error: null });

    try {
      await tasksApi.delete(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : translate("errors.deleteTaskFailed");
      // Rollback: restore previous tasks
      set({ tasks: previousTasks, error: message });
      throw error;
    }
  },

  moveTask: async (id, list_id) => {
    const previousTasks = [...get().tasks];

    // Optimistic: move task to new list immediately
    const optimisticTasks = previousTasks.map((t) =>
      t.id === id ? { ...t, list_id } : t
    );
    set({ tasks: optimisticTasks, error: null });

    try {
      const updatedTask = await tasksApi.update(id, { list_id });
      const tasks = get().tasks.map((t) => (t.id === id ? updatedTask : t));
      set({ tasks, error: null });
      return updatedTask;
    } catch (error) {
      const message = error instanceof Error ? error.message : translate("errors.moveTaskFailedStore");
      // Rollback: restore previous tasks
      set({ tasks: previousTasks, error: message });
      throw error;
    }
  },

  reorderTasks: async (orderedTaskIds) => {
    const previousTasks = [...get().tasks];
    if (previousTasks.length <= 1) return;

    const taskMap = new Map(previousTasks.map((task) => [task.id, task]));
    const reorderedTasks = orderedTaskIds
      .map((taskId) => taskMap.get(taskId))
      .filter((task): task is Task => Boolean(task));

    if (reorderedTasks.length !== orderedTaskIds.length) return;

    // Calculate new sort_order values based on position
    const minSortOrder = reorderedTasks.reduce(
      (min, task) => Math.min(min, task.sort_order),
      reorderedTasks[0]?.sort_order ?? 0,
    );

    const nextTasks = reorderedTasks.map((task, index) => ({
      ...task,
      sort_order: minSortOrder + index,
    }));

    const changedTasks = nextTasks.filter((task) => {
      const previous = taskMap.get(task.id);
      return previous ? previous.sort_order !== task.sort_order : false;
    });

    if (changedTasks.length === 0) return;

    // Optimistic update
    const allTasks = get().tasks.map((task) => {
      const updated = nextTasks.find((t) => t.id === task.id);
      return updated ?? task;
    });
    allTasks.sort((a, b) => a.sort_order - b.sort_order);
    set({ tasks: allTasks, error: null });

    try {
      const updatedTasks = await Promise.all(
        changedTasks.map((task) =>
          tasksApi.update(task.id, { name: task.name, sort_order: task.sort_order }),
        ),
      );

      const updatedMap = new Map(updatedTasks.map((task) => [task.id, task]));
      const mergedTasks = get().tasks.map((task) => updatedMap.get(task.id) ?? task);
      mergedTasks.sort((a, b) => a.sort_order - b.sort_order);
      set({ tasks: mergedTasks, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : translate("errors.reorderTasksFailed");
      set({ tasks: previousTasks, error: message });
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
