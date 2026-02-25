'use server'

import type { Task, TaskInsert, TaskUpdate } from '@puratodo/api-types'
import {
  bulkDeleteTasks,
  bulkUpdateTasks,
  createTask as dbCreateTask,
  deleteTask as dbDeleteTask,
  reorderTasks as dbReorderTasks,
  updateTask as dbUpdateTask,
  getSubtasks,
  getTaskById,
  getTasks,
  moveInboxTaskToList,
} from '@/actions/tasks'

// Individual server actions for each adapter method

export async function createTask(task: TaskInsert): Promise<Task> {
  const result = await dbCreateTask(task.list_id, task.name, task.parent_id || undefined)

  if (!result.success) {
    throw new Error(result.error || 'Failed to create task')
  }

  const tasks = await getTasks(task.list_id)
  const createdTask = tasks.find(t =>
    t.name === task.name
    && t.parent_id === task.parent_id
    && t.list_id === task.list_id,
  )

  if (!createdTask) {
    throw new Error('Failed to fetch created task')
  }

  return createdTask
}

export async function getTask(id: string): Promise<Task | null> {
  return await getTaskById(id)
}

export async function updateTask(id: string, updates: TaskUpdate): Promise<Task> {
  const result = await dbUpdateTask(id, updates)

  if (!result.success) {
    throw new Error(result.error || 'Failed to update task')
  }

  const updatedTask = await getTaskById(id)
  if (!updatedTask) {
    throw new Error('Failed to fetch updated task')
  }

  return updatedTask
}

export async function deleteTask(id: string): Promise<void> {
  const result = await dbDeleteTask(id)

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete task')
  }
}

export async function getTasksByList(listId: string): Promise<Task[]> {
  return await getTasks(listId)
}

export async function getTasksByParent(parentId: string): Promise<Task[]> {
  return await getSubtasks(parentId)
}

export async function getRootTasks(listId: string): Promise<Task[]> {
  return await getTasks(listId)
}

export async function getAllTasks(): Promise<Task[]> {
  return await getTasks()
}

export async function toggleComplete(id: string, completed: boolean): Promise<Task> {
  return await updateTask(id, { completed })
}

export async function toggleStar(id: string, starred: boolean): Promise<Task> {
  return await updateTask(id, { starred })
}

export async function moveTask(taskId: string, targetListId: string): Promise<Task> {
  const result = await moveInboxTaskToList(taskId, targetListId)

  if (!result.success) {
    throw new Error(result.error || 'Failed to move task')
  }

  const movedTask = await getTaskById(taskId)
  if (!movedTask) {
    throw new Error('Failed to fetch moved task')
  }

  return movedTask
}

export async function reorderTasks(taskIds: string[]): Promise<void> {
  if (taskIds.length === 0)
    return

  const firstTask = await getTaskById(taskIds[0])
  if (!firstTask) {
    throw new Error('Task not found')
  }

  const result = await dbReorderTasks(
    firstTask.list_id,
    taskIds,
    firstTask.parent_id || undefined,
  )

  if (!result.success) {
    throw new Error(result.error || 'Failed to reorder tasks')
  }
}

export async function bulkComplete(taskIds: string[], completed: boolean): Promise<void> {
  const result = await bulkUpdateTasks(taskIds, { completed })

  if (!result.success) {
    throw new Error(result.error || 'Failed to bulk complete tasks')
  }
}

export async function bulkStar(taskIds: string[], starred: boolean): Promise<void> {
  const result = await bulkUpdateTasks(taskIds, { starred })

  if (!result.success) {
    throw new Error(result.error || 'Failed to bulk star tasks')
  }
}

export async function bulkDelete(taskIds: string[]): Promise<void> {
  const result = await bulkDeleteTasks(taskIds)

  if (!result.success) {
    throw new Error(result.error || 'Failed to bulk delete tasks')
  }
}

export async function bulkMove(taskIds: string[], targetListId: string): Promise<void> {
  for (const taskId of taskIds) {
    await moveTask(taskId, targetListId)
  }
}

export async function bulkSetDate(
  taskIds: string[],
  dateField: 'due_date' | 'plan_date',
  date: string | null,
): Promise<void> {
  const update: TaskUpdate = {}
  update[dateField] = date

  const result = await bulkUpdateTasks(taskIds, update)

  if (!result.success) {
    throw new Error(result.error || 'Failed to bulk set date')
  }
}
