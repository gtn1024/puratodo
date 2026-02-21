import { TaskAdapter } from "@puratodo/api-types";
import * as taskActions from "./taskActions";

/**
 * SupabaseTaskAdapter - Implements TaskAdapter interface using Supabase Server Actions
 * This adapter is used by the web app to interact with task data
 *
 * Note: This is a plain object with methods that call server actions.
 * Each method delegates to a server action that can be called from client components.
 */
export const SupabaseTaskAdapter: TaskAdapter = {
  createTask: taskActions.createTask,
  getTask: taskActions.getTask,
  updateTask: taskActions.updateTask,
  deleteTask: taskActions.deleteTask,
  getTasksByList: taskActions.getTasksByList,
  getTasksByParent: taskActions.getTasksByParent,
  getRootTasks: taskActions.getRootTasks,
  getAllTasks: taskActions.getAllTasks,
  toggleComplete: taskActions.toggleComplete,
  toggleStar: taskActions.toggleStar,
  moveTask: taskActions.moveTask,
  reorderTasks: taskActions.reorderTasks,
  bulkComplete: taskActions.bulkComplete,
  bulkStar: taskActions.bulkStar,
  bulkDelete: taskActions.bulkDelete,
  bulkMove: taskActions.bulkMove,
  bulkSetDate: taskActions.bulkSetDate,
};
