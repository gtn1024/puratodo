import { Task, TaskInsert, TaskUpdate, List, ListInsert, ListUpdate, Group, GroupInsert, GroupUpdate } from './index';

/**
 * TaskAdapter - Abstract interface for task operations
 * Implemented by SupabaseTaskAdapter (web) and RestTaskAdapter (app)
 */
export interface TaskAdapter {
  // Task CRUD operations
  createTask(task: TaskInsert): Promise<Task>;
  getTask(id: string): Promise<Task | null>;
  updateTask(id: string, updates: TaskUpdate): Promise<Task>;
  deleteTask(id: string): Promise<void>;

  // Task queries
  getTasksByList(listId: string): Promise<Task[]>;
  getTasksByParent(parentId: string): Promise<Task[]>;
  getRootTasks(listId: string): Promise<Task[]>; // Get top-level tasks (no parent)
  getAllTasks(): Promise<Task[]>;

  // Task operations
  toggleComplete(id: string, completed: boolean): Promise<Task>;
  toggleStar(id: string, starred: boolean): Promise<Task>;
  moveTask(taskId: string, targetListId: string): Promise<Task>;
  reorderTasks(taskIds: string[]): Promise<void>; // Update sort_order for multiple tasks

  // Bulk operations
  bulkComplete(taskIds: string[], completed: boolean): Promise<void>;
  bulkStar(taskIds: string[], starred: boolean): Promise<void>;
  bulkDelete(taskIds: string[]): Promise<void>;
  bulkMove(taskIds: string[], targetListId: string): Promise<void>;
  bulkSetDate(taskIds: string[], dateField: 'due_date' | 'plan_date', date: string | null): Promise<void>;
}

/**
 * ListAdapter - Abstract interface for list operations
 * Implemented by SupabaseListAdapter (web) and RestListAdapter (app)
 */
export interface ListAdapter {
  // List CRUD operations
  createList(list: ListInsert): Promise<List>;
  getList(id: string): Promise<List | null>;
  updateList(id: string, updates: ListUpdate): Promise<List>;
  deleteList(id: string): Promise<void>;

  // List queries
  getListsByGroup(groupId: string): Promise<List[]>;
  getAllLists(): Promise<List[]>;

  // List operations
  moveList(listId: string, targetGroupId: string): Promise<List>;
  reorderLists(listIds: string[]): Promise<void>; // Update sort_order for multiple lists
}

/**
 * GroupAdapter - Abstract interface for group operations
 * Implemented by SupabaseGroupAdapter (web) and RestGroupAdapter (app)
 */
export interface GroupAdapter {
  // Group CRUD operations
  createGroup(group: GroupInsert): Promise<Group>;
  getGroup(id: string): Promise<Group | null>;
  updateGroup(id: string, updates: GroupUpdate): Promise<Group>;
  deleteGroup(id: string): Promise<void>;

  // Group queries
  getAllGroups(): Promise<Group[]>;

  // Group operations
  reorderGroups(groupIds: string[]): Promise<void>; // Update sort_order for multiple groups
}

/**
 * AdapterContext - Combined context for all adapters
 * Used to provide adapters to components via React Context
 */
export interface AdapterContext {
  taskAdapter: TaskAdapter;
  listAdapter: ListAdapter;
  groupAdapter: GroupAdapter;
}
