'use server'

import type { RecurrenceUpdateScope } from '@/lib/recurrence-runtime'
import { getLocalDateString } from '@puratodo/shared'
import { revalidatePath } from 'next/cache'
import { getOrCreateInboxListForUser } from '@/lib/inbox'
import {

  updateTaskWithRecurrenceHandling,
} from '@/lib/recurrence-runtime'
import { createClient } from '@/lib/supabase/server'

export interface Task {
  id: string
  user_id: string
  list_id: string
  parent_id: string | null
  name: string
  completed: boolean
  starred: boolean
  due_date: string | null
  plan_date: string | null
  comment: string | null
  url: string | null
  duration_minutes: number | null
  recurrence_frequency: string | null
  recurrence_interval: number | null
  recurrence_weekdays: number[] | null
  recurrence_end_date: string | null
  recurrence_end_count: number | null
  recurrence_rule: string | null
  recurrence_timezone: string | null
  recurrence_source_task_id: string | null
  remind_at: string | null
  reminder_sent_at: string | null
  sort_order: number
  created_at: string
  updated_at: string
  subtasks?: Task[]
}

type TaskUpdatePayload = Partial<{
  name: string
  completed: boolean
  starred: boolean
  due_date: string | null
  plan_date: string | null
  comment: string | null
  url: string | null
  duration_minutes: number | null
  recurrence_frequency: string | null
  recurrence_interval: number | null
  recurrence_weekdays: number[] | null
  recurrence_end_date: string | null
  recurrence_end_count: number | null
  recurrence_rule: string | null
  recurrence_timezone: string | null
  recurrence_source_task_id: string | null
  recurrence_update_scope: RecurrenceUpdateScope
  remind_at: string | null
  reminder_sent_at: string | null
}>

export async function getTasks(listId?: string): Promise<Task[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .is('parent_id', null) // Only get top-level tasks
    .order('sort_order', { ascending: true })

  if (listId) {
    query = query.eq('list_id', listId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching tasks:', error)
    return []
  }

  return data || []
}

export async function createTask(
  listId: string,
  name: string,
  parentId?: string,
  options?: {
    due_date?: string | null
    plan_date?: string | null
    duration_minutes?: number | null
    starred?: boolean
  },
): Promise<{ success: boolean, error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get max sort_order for this list (and parent if specified)
  const query = supabase
    .from('tasks')
    .select('sort_order')
    .eq('list_id', listId)
    .eq('user_id', user.id)

  const filteredQuery = parentId
    ? query.eq('parent_id', parentId)
    : query.is('parent_id', null)

  const { data: existingTasks } = await filteredQuery
    .order('sort_order', { ascending: false })
    .limit(1)

  const maxOrder = existingTasks?.[0]?.sort_order ?? -1

  const { error } = await supabase.from('tasks').insert({
    user_id: user.id,
    list_id: listId,
    parent_id: parentId || null,
    name,
    completed: false,
    starred: options?.starred ?? false,
    due_date: options?.due_date ?? null,
    plan_date: options?.plan_date ?? null,
    duration_minutes: options?.duration_minutes ?? null,
    sort_order: maxOrder + 1,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateTask(
  id: string,
  data: TaskUpdatePayload,
): Promise<{ success: boolean, error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const result = await updateTaskWithRecurrenceHandling({
    supabase,
    userId: user.id,
    taskId: id,
    patch: data,
  })

  if (result.error) {
    return { success: false, error: result.error }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteTask(
  id: string,
): Promise<{ success: boolean, error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function bulkUpdateTasks(
  taskIds: string[],
  data: TaskUpdatePayload,
): Promise<{ success: boolean, error?: string }> {
  if (taskIds.length === 0) {
    return { success: true }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('tasks')
    .update(data)
    .eq('user_id', user.id)
    .in('id', taskIds)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function bulkDeleteTasks(
  taskIds: string[],
): Promise<{ success: boolean, error?: string }> {
  if (taskIds.length === 0) {
    return { success: true }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('user_id', user.id)
    .in('id', taskIds)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function getInboxTasksWithSubtasks(): Promise<Task[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const inboxList = await getOrCreateInboxListForUser(supabase, user.id)
  if (!inboxList) {
    return []
  }

  return getTasksWithSubtasks(inboxList.id)
}

export async function createInboxTask(
  name: string,
  parentId?: string,
  options?: {
    due_date?: string | null
    plan_date?: string | null
    duration_minutes?: number | null
    starred?: boolean
  },
): Promise<{ success: boolean, error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const inboxList = await getOrCreateInboxListForUser(supabase, user.id)
  if (!inboxList) {
    return { success: false, error: 'Inbox list unavailable' }
  }

  if (parentId) {
    const { data: parentTask, error: parentError } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', parentId)
      .eq('user_id', user.id)
      .eq('list_id', inboxList.id)
      .single()

    if (parentError || !parentTask) {
      return { success: false, error: 'Parent task not found in Inbox' }
    }
  }

  return createTask(inboxList.id, name, parentId, options)
}

export async function updateInboxTask(
  id: string,
  data: TaskUpdatePayload,
): Promise<{ success: boolean, error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const inboxList = await getOrCreateInboxListForUser(supabase, user.id)
  if (!inboxList) {
    return { success: false, error: 'Inbox list unavailable' }
  }

  const { data: inboxTask, error: fetchError } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('list_id', inboxList.id)
    .single()

  if (fetchError || !inboxTask) {
    return { success: false, error: 'Inbox task not found' }
  }

  const result = await updateTaskWithRecurrenceHandling({
    supabase,
    userId: user.id,
    taskId: id,
    patch: data,
    listId: inboxList.id,
  })

  if (result.error) {
    return { success: false, error: result.error }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteInboxTask(
  id: string,
): Promise<{ success: boolean, error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const inboxList = await getOrCreateInboxListForUser(supabase, user.id)
  if (!inboxList) {
    return { success: false, error: 'Inbox list unavailable' }
  }

  const { data: inboxTask, error: fetchError } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('list_id', inboxList.id)
    .single()

  if (fetchError || !inboxTask) {
    return { success: false, error: 'Inbox task not found' }
  }

  const { error: deleteError } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('list_id', inboxList.id)

  if (deleteError) {
    return { success: false, error: deleteError.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function moveInboxTaskToList(
  id: string,
  targetListId: string,
): Promise<{ success: boolean, error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  if (!id || !targetListId) {
    return { success: false, error: 'Task id and target list id are required' }
  }

  const inboxList = await getOrCreateInboxListForUser(supabase, user.id)
  if (!inboxList) {
    return { success: false, error: 'Inbox list unavailable' }
  }

  if (targetListId === inboxList.id) {
    return { success: false, error: 'Target list must be different from Inbox' }
  }

  const { data: inboxTask, error: inboxTaskError } = await supabase
    .from('tasks')
    .select('id, parent_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('list_id', inboxList.id)
    .single()

  if (inboxTaskError || !inboxTask) {
    return { success: false, error: 'Inbox task not found' }
  }

  if (inboxTask.parent_id) {
    return {
      success: false,
      error: 'Only top-level inbox tasks can be moved',
    }
  }

  const { data: targetList, error: targetListError } = await supabase
    .from('lists')
    .select('id')
    .eq('id', targetListId)
    .eq('user_id', user.id)
    .single()

  if (targetListError || !targetList) {
    return { success: false, error: 'Target list not found' }
  }

  const { data: existingTargetTasks, error: sortFetchError } = await supabase
    .from('tasks')
    .select('sort_order')
    .eq('user_id', user.id)
    .eq('list_id', targetListId)
    .is('parent_id', null)
    .order('sort_order', { ascending: false })
    .limit(1)

  if (sortFetchError) {
    return { success: false, error: sortFetchError.message }
  }

  const nextSortOrder = (existingTargetTasks?.[0]?.sort_order ?? -1) + 1

  const descendantIds: string[] = []
  let frontier = [id]

  // Move the whole subtree so nested inbox tasks stay attached to their parent.
  while (frontier.length > 0) {
    const { data: children, error: childrenError } = await supabase
      .from('tasks')
      .select('id')
      .eq('user_id', user.id)
      .eq('list_id', inboxList.id)
      .in('parent_id', frontier)

    if (childrenError) {
      return { success: false, error: childrenError.message }
    }

    if (!children || children.length === 0) {
      break
    }

    const childIds = children.map(task => task.id)
    descendantIds.push(...childIds)
    frontier = childIds
  }

  const subtreeIds = [id, ...descendantIds]

  const { error: subtreeMoveError } = await supabase
    .from('tasks')
    .update({ list_id: targetListId })
    .in('id', subtreeIds)
    .eq('user_id', user.id)
    .eq('list_id', inboxList.id)

  if (subtreeMoveError) {
    return { success: false, error: subtreeMoveError.message }
  }

  const { error: rootTaskUpdateError } = await supabase
    .from('tasks')
    .update({ parent_id: null, sort_order: nextSortOrder })
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('list_id', targetListId)

  if (rootTaskUpdateError) {
    return { success: false, error: rootTaskUpdateError.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function reorderTasks(
  listId: string,
  orderedIds: string[],
  parentId?: string,
): Promise<{ success: boolean, error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Update sort_order for each task
  const updates = orderedIds.map((id, index) => {
    let query = supabase
      .from('tasks')
      .update({ sort_order: index })
      .eq('id', id)
      .eq('list_id', listId)
      .eq('user_id', user.id)

    if (parentId) {
      query = query.eq('parent_id', parentId)
    }
    else {
      query = query.is('parent_id', null)
    }

    return query
  })

  const results = await Promise.all(updates.map(q => q))
  const errors = results.filter(r => r.error)

  if (errors.length > 0) {
    return { success: false, error: errors[0].error?.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function getSubtasks(parentId: string): Promise<Task[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('parent_id', parentId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching subtasks:', error)
    return []
  }

  return data || []
}

export async function getTasksWithSubtasks(listId?: string): Promise<Task[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .is('parent_id', null)
    .order('sort_order', { ascending: true })

  if (listId) {
    query = query.eq('list_id', listId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching tasks:', error)
    return []
  }

  // Recursively fetch subtasks for each task
  const fetchSubtasksRecursively = async (tasks: Task[]): Promise<Task[]> => {
    const tasksWithSubtasks = await Promise.all(
      tasks.map(async (task) => {
        const { data: subtasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .eq('parent_id', task.id)
          .order('sort_order', { ascending: true })

        if (subtasks && subtasks.length > 0) {
          const nestedSubtasks = await fetchSubtasksRecursively(subtasks)
          return { ...task, subtasks: nestedSubtasks }
        }
        return { ...task, subtasks: [] }
      }),
    )
    return tasksWithSubtasks as Task[]
  }

  return fetchSubtasksRecursively(data || [])
}

export type TaskSearchResult = Task & {
  list_name: string
  list_icon: string
  group_name: string
  group_color: string
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

async function attachTaskContext(
  supabase: SupabaseServerClient,
  tasks: Task[],
): Promise<TaskSearchResult[]> {
  if (tasks.length === 0) {
    return []
  }

  const listIds = [...new Set(tasks.map(task => task.list_id))]
  const { data: listsData, error: listsError } = await supabase
    .from('lists')
    .select('id, name, icon, group_id')
    .in('id', listIds)

  if (listsError) {
    console.error('Error fetching lists for task context:', listsError)
  }

  const lists = listsData || []
  const groupIds = [...new Set(lists.map(list => list.group_id))]

  let groups: { id: string, name: string, color: string | null }[] = []
  if (groupIds.length > 0) {
    const { data: groupsData, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, color')
      .in('id', groupIds)

    if (groupsError) {
      console.error('Error fetching groups for task context:', groupsError)
    }
    else {
      groups = groupsData || []
    }
  }

  return tasks.map((task) => {
    const list = lists.find(item => item.id === task.list_id)
    const group = groups.find(item => item.id === list?.group_id)

    return {
      ...task,
      list_name: list?.name || 'Unknown List',
      list_icon: list?.icon || '📋',
      group_name: group?.name || 'Unknown Group',
      group_color: group?.color || '#6b7280',
    }
  })
}

export async function searchTasks(query: string): Promise<TaskSearchResult[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !query.trim()) {
    return []
  }

  // Search tasks by name (case-insensitive)
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .ilike('name', `%${query.trim()}%`)
    .order('updated_at', { ascending: false })
    .limit(50)

  if (error || !tasks) {
    console.error('Error searching tasks:', error)
    return []
  }

  return attachTaskContext(supabase, tasks as Task[])
}

export async function getTaskById(id: string): Promise<Task | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('Error fetching task:', error)
    return null
  }

  return data
}

export async function getTodayTasks(): Promise<TaskSearchResult[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const today = getLocalDateString(new Date())

  // Get tasks with plan_date = today
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('plan_date', today)
    .order('sort_order', { ascending: true })

  if (error || !tasks) {
    console.error('Error fetching today\'s tasks:', error)
    return []
  }

  return attachTaskContext(supabase, tasks as Task[])
}

export async function getStarredTasks(): Promise<TaskSearchResult[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .is('parent_id', null)
    .eq('starred', true)
    .order('updated_at', { ascending: false })

  if (error || !tasks) {
    console.error('Error fetching starred tasks:', error)
    return []
  }

  return attachTaskContext(supabase, tasks as Task[])
}

export async function getOverdueTasks(): Promise<TaskSearchResult[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const today = getLocalDateString(new Date())

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .is('parent_id', null)
    .eq('completed', false)
    .not('due_date', 'is', null)
    .lt('due_date', today)
    .order('due_date', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error || !tasks) {
    console.error('Error fetching overdue tasks:', error)
    return []
  }

  return attachTaskContext(supabase, tasks as Task[])
}

export async function getNext7DaysTasks(): Promise<TaskSearchResult[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const now = new Date()
  const startDate = getLocalDateString(now)
  const end = new Date(now)
  end.setDate(end.getDate() + 7)
  const endDate = getLocalDateString(end)

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .is('parent_id', null)
    .eq('completed', false)
    .not('due_date', 'is', null)
    .gte('due_date', startDate)
    .lte('due_date', endDate)
    .order('due_date', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error || !tasks) {
    console.error('Error fetching next 7 days tasks:', error)
    return []
  }

  return attachTaskContext(supabase, tasks as Task[])
}

export async function getNoDateTasks(): Promise<TaskSearchResult[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .is('parent_id', null)
    .eq('completed', false)
    .is('due_date', null)
    .is('plan_date', null)
    .order('updated_at', { ascending: false })

  if (error || !tasks) {
    console.error('Error fetching no-date tasks:', error)
    return []
  }

  return attachTaskContext(supabase, tasks as Task[])
}

// Get all tasks within a date range (by plan_date or due_date)
// Show tasks that have plan_date or due_date in the range.
// If a parent has subtasks, both parent and subtasks are shown independently
// (whichever has dates in range will appear on those dates).
export async function getTasksInDateRange(
  startDate: string,
  endDate: string,
  listId?: string,
): Promise<TaskSearchResult[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  // Get ALL tasks (including subtasks) where plan_date or due_date is within the range
  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .or(
      `and(plan_date.gte.${startDate},plan_date.lte.${endDate}),and(due_date.gte.${startDate},due_date.lte.${endDate})`,
    )

  if (listId) {
    query = query.eq('list_id', listId)
  }

  const { data: tasks, error } = await query.order('plan_date', { ascending: true })

  if (error || !tasks) {
    console.error('Error fetching tasks in date range:', error)
    return []
  }

  return attachTaskContext(supabase, tasks as Task[])
}

// Get all unscheduled tasks (no plan_date)
// Show tasks that don't have plan_date.
// Both parent tasks and subtasks are returned independently.
export async function getUnscheduledTasks(
  listId?: string,
): Promise<TaskSearchResult[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('completed', false)
    .is('plan_date', null)

  if (listId) {
    query = query.eq('list_id', listId)
  }

  const { data: tasks, error } = await query.order('updated_at', { ascending: false })

  if (error || !tasks) {
    console.error('Error fetching unscheduled tasks:', error)
    return []
  }

  return attachTaskContext(supabase, tasks as Task[])
}
