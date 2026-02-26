'use server'

import { getLocalDateString } from '@puratodo/shared'
import { createClient } from '@/lib/supabase/server'

export interface CompletedTask {
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
  created_at: string
  updated_at: string
  // Context fields
  list_name: string
  list_icon: string
  group_id: string
  group_name: string
  group_color: string
}

export interface DailyMetrics {
  date: string
  total_completed: number
  total_duration_minutes: number
  starred_count: number
  tasks: CompletedTask[]
}

export interface ListMetrics {
  list_id: string
  list_name: string
  list_icon: string
  group_id: string
  group_name: string
  group_color: string
  total_completed: number
  total_duration_minutes: number
  tasks: CompletedTask[]
}

export interface GroupMetrics {
  group_id: string
  group_name: string
  group_color: string
  total_completed: number
  total_duration_minutes: number
  lists: ListMetrics[]
}

export interface ReviewMetrics {
  period_start: string
  period_end: string
  period_type: 'weekly' | 'monthly'
  // Overall stats
  total_completed: number
  total_starred: number
  total_duration_minutes: number
  avg_daily_completed: number
  // Breakdowns
  by_day: DailyMetrics[]
  by_list: ListMetrics[]
  by_group: GroupMetrics[]
  // Task lists
  all_tasks: CompletedTask[]
}

/**
 * Get completed tasks within a date range
 */
export async function getCompletedTasksInDateRange(
  startDate: string,
  endDate: string,
): Promise<CompletedTask[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  // Query tasks completed within the date range
  // We use updated_at as a proxy for completion date since there's no dedicated completed_at field
  // Filter by completed=true and updated_at in range
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('completed', true)
    .gte('updated_at', `${startDate}T00:00:00`)
    .lte('updated_at', `${endDate}T23:59:59`)
    .order('updated_at', { ascending: false })

  if (error || !tasks) {
    console.error('Error fetching completed tasks:', error)
    return []
  }

  // Attach context (list/group info)
  return attachCompletedTaskContext(supabase, tasks)
}

/**
 * Attach list and group context to completed tasks
 */
async function attachCompletedTaskContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tasks: any[],
): Promise<CompletedTask[]> {
  if (tasks.length === 0) {
    return []
  }

  const listIds = [...new Set(tasks.map(task => task.list_id))]
  const { data: listsData, error: listsError } = await supabase
    .from('lists')
    .select('id, name, icon, group_id')
    .in('id', listIds)

  if (listsError) {
    console.error('Error fetching lists for completed task context:', listsError)
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
      console.error('Error fetching groups for completed task context:', groupsError)
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
      group_id: group?.id || '',
      group_name: group?.name || 'Unknown Group',
      group_color: group?.color || '#6b7280',
    }
  })
}

/**
 * Generate weekly review metrics
 */
export async function getWeeklyReview(
  weekEndDate?: string,
): Promise<ReviewMetrics> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return createEmptyReviewMetrics('', '', 'weekly')
  }

  // Calculate week range (default: last 7 days ending today)
  const end = weekEndDate ? new Date(weekEndDate) : new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 6) // 7 days including end date

  const startDate = getLocalDateString(start)
  const endDate = getLocalDateString(end)

  const tasks = await getCompletedTasksInDateRange(startDate, endDate)

  return buildReviewMetrics(tasks, startDate, endDate, 'weekly')
}

/**
 * Generate monthly review metrics
 */
export async function getMonthlyReview(
  monthEndDate?: string,
): Promise<ReviewMetrics> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return createEmptyReviewMetrics('', '', 'monthly')
  }

  // Calculate month range (default: last 30 days ending today)
  const end = monthEndDate ? new Date(monthEndDate) : new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 29) // 30 days including end date

  const startDate = getLocalDateString(start)
  const endDate = getLocalDateString(end)

  const tasks = await getCompletedTasksInDateRange(startDate, endDate)

  return buildReviewMetrics(tasks, startDate, endDate, 'monthly')
}

/**
 * Build review metrics from completed tasks
 */
function buildReviewMetrics(
  tasks: CompletedTask[],
  startDate: string,
  endDate: string,
  periodType: 'weekly' | 'monthly',
): ReviewMetrics {
  // Overall stats
  const total_completed = tasks.length
  const total_starred = tasks.filter(t => t.starred).length
  const total_duration_minutes = tasks.reduce(
    (sum, t) => sum + (t.duration_minutes || 0),
    0,
  )

  // Calculate number of days in period
  const start = new Date(startDate)
  const end = new Date(endDate)
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const avg_daily_completed = daysDiff > 0 ? Math.round((total_completed / daysDiff) * 10) / 10 : 0

  // By day breakdown
  const by_day: DailyMetrics[] = []
  const tasksByDate = new Map<string, CompletedTask[]>()

  for (const task of tasks) {
    // Extract date from updated_at (completion date)
    const completionDate = task.updated_at.split('T')[0]
    if (!tasksByDate.has(completionDate)) {
      tasksByDate.set(completionDate, [])
    }
    tasksByDate.get(completionDate)!.push(task)
  }

  // Fill in all dates in range (including days with no completions)
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = getLocalDateString(d)
    const dayTasks = tasksByDate.get(dateStr) || []

    by_day.push({
      date: dateStr,
      total_completed: dayTasks.length,
      total_duration_minutes: dayTasks.reduce(
        (sum, t) => sum + (t.duration_minutes || 0),
        0,
      ),
      starred_count: dayTasks.filter(t => t.starred).length,
      tasks: dayTasks,
    })
  }

  // By list breakdown
  const tasksByList = new Map<string, CompletedTask[]>()
  for (const task of tasks) {
    if (!tasksByList.has(task.list_id)) {
      tasksByList.set(task.list_id, [])
    }
    tasksByList.get(task.list_id)!.push(task)
  }

  const by_list: ListMetrics[] = []
  for (const [listId, listTasks] of tasksByList) {
    const firstTask = listTasks[0]
    by_list.push({
      list_id: listId,
      list_name: firstTask.list_name,
      list_icon: firstTask.list_icon,
      group_id: firstTask.group_id,
      group_name: firstTask.group_name,
      group_color: firstTask.group_color,
      total_completed: listTasks.length,
      total_duration_minutes: listTasks.reduce(
        (sum, t) => sum + (t.duration_minutes || 0),
        0,
      ),
      tasks: listTasks,
    })
  }

  // Sort by total completed (descending)
  by_list.sort((a, b) => b.total_completed - a.total_completed)

  // By group breakdown
  const tasksByGroup = new Map<string, CompletedTask[]>()
  for (const task of tasks) {
    if (!tasksByGroup.has(task.group_id)) {
      tasksByGroup.set(task.group_id, [])
    }
    tasksByGroup.get(task.group_id)!.push(task)
  }

  const by_group: GroupMetrics[] = []
  for (const [groupId, groupTasks] of tasksByGroup) {
    const firstTask = groupTasks[0]

    // Get lists within this group
    const groupLists = by_list.filter(l => l.group_id === groupId)

    by_group.push({
      group_id: groupId,
      group_name: firstTask.group_name,
      group_color: firstTask.group_color,
      total_completed: groupTasks.length,
      total_duration_minutes: groupTasks.reduce(
        (sum, t) => sum + (t.duration_minutes || 0),
        0,
      ),
      lists: groupLists,
    })
  }

  // Sort by total completed (descending)
  by_group.sort((a, b) => b.total_completed - a.total_completed)

  return {
    period_start: startDate,
    period_end: endDate,
    period_type: periodType,
    total_completed,
    total_starred,
    total_duration_minutes,
    avg_daily_completed,
    by_day,
    by_list,
    by_group,
    all_tasks: tasks,
  }
}

/**
 * Create empty review metrics structure
 */
function createEmptyReviewMetrics(
  startDate: string,
  endDate: string,
  periodType: 'weekly' | 'monthly',
): ReviewMetrics {
  return {
    period_start: startDate,
    period_end: endDate,
    period_type: periodType,
    total_completed: 0,
    total_starred: 0,
    total_duration_minutes: 0,
    avg_daily_completed: 0,
    by_day: [],
    by_list: [],
    by_group: [],
    all_tasks: [],
  }
}
