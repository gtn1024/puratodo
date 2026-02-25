import type { Task, TaskAdapter, TaskInsert, TaskUpdate } from '@puratodo/api-types'
import { translate } from '../i18n'
import { tasksApi } from '../lib/api/tasks'

/**
 * RestTaskAdapter - Implements TaskAdapter interface using REST API
 * This adapter is used by the Tauri app to interact with task data via REST API
 *
 * Note: This is a plain object with methods that call REST API endpoints.
 * Bulk operations are implemented by making multiple individual API calls when needed.
 */
export const RestTaskAdapter: TaskAdapter = {
  async createTask(task: TaskInsert): Promise<Task> {
    return await tasksApi.create({
      list_id: task.list_id,
      name: task.name,
      parent_id: task.parent_id,
    })
  },

  async getTask(id: string): Promise<Task | null> {
    try {
      const allTasks = await tasksApi.list()
      return allTasks.find(t => t.id === id) || null
    }
    catch {
      return null
    }
  },

  async updateTask(id: string, updates: TaskUpdate): Promise<Task> {
    return await tasksApi.update(id, updates)
  },

  async deleteTask(id: string): Promise<void> {
    await tasksApi.delete(id)
  },

  async getTasksByList(listId: string): Promise<Task[]> {
    const allTasks = await tasksApi.list()
    return allTasks.filter(t => t.list_id === listId)
  },

  async getTasksByParent(parentId: string): Promise<Task[]> {
    const allTasks = await tasksApi.list()
    return allTasks.filter(t => t.parent_id === parentId)
  },

  async getRootTasks(listId: string): Promise<Task[]> {
    const allTasks = await tasksApi.list()
    return allTasks.filter(t => t.list_id === listId && t.parent_id === null)
  },

  async getAllTasks(): Promise<Task[]> {
    return await tasksApi.list()
  },

  async toggleComplete(id: string, completed: boolean): Promise<Task> {
    return await this.updateTask(id, { completed })
  },

  async toggleStar(id: string, starred: boolean): Promise<Task> {
    return await this.updateTask(id, { starred })
  },

  async moveTask(taskId: string, targetListId: string): Promise<Task> {
    return await this.updateTask(taskId, { list_id: targetListId })
  },

  async reorderTasks(taskIds: string[]): Promise<void> {
    if (taskIds.length === 0)
      return

    // Get the first task to determine list_id and parent_id
    const firstTask = await this.getTask(taskIds[0])
    if (!firstTask) {
      throw new Error(translate('errors.taskNotFound'))
    }

    // Update sort_order for each task
    await Promise.all(
      taskIds.map((id, index) =>
        this.updateTask(id, { sort_order: index }),
      ),
    )
  },

  async bulkComplete(taskIds: string[], completed: boolean): Promise<void> {
    await Promise.all(
      taskIds.map(id => this.toggleComplete(id, completed)),
    )
  },

  async bulkStar(taskIds: string[], starred: boolean): Promise<void> {
    await Promise.all(
      taskIds.map(id => this.toggleStar(id, starred)),
    )
  },

  async bulkDelete(taskIds: string[]): Promise<void> {
    await Promise.all(
      taskIds.map(id => this.deleteTask(id)),
    )
  },

  async bulkMove(taskIds: string[], targetListId: string): Promise<void> {
    await Promise.all(
      taskIds.map(id => this.moveTask(id, targetListId)),
    )
  },

  async bulkSetDate(
    taskIds: string[],
    dateField: 'due_date' | 'plan_date',
    date: string | null,
  ): Promise<void> {
    await Promise.all(
      taskIds.map(id => this.updateTask(id, { [dateField]: date })),
    )
  },
}
