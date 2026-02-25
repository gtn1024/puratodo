import type { NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api/auth'
import {
  corsPreflightResponse,
  errorResponse,
  successResponse,
  unauthorizedResponse,
  withCors,
} from '@/lib/api/response'

export interface TaskSearchResult {
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
  duration_minutes: number | null
  recurrence_frequency: string | null
  recurrence_interval: number | null
  recurrence_weekdays: number[] | null
  recurrence_end_date: string | null
  recurrence_end_count: number | null
  recurrence_rule: string | null
  recurrence_timezone: string | null
  recurrence_source_task_id: string | null
  sort_order: number
  created_at: string
  updated_at: string
  list_name: string
  list_icon: string
  group_name: string
  group_color: string
}

export interface PaginatedSearchResult {
  data: TaskSearchResult[]
  total: number
  page: number
  limit: number
  total_pages: number
}

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return corsPreflightResponse()
}

// GET /api/v1/search/tasks - Search tasks by name
export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request.headers.get('Authorization'))

  if (!auth) {
    return withCors(unauthorizedResponse())
  }

  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const page = Number.parseInt(searchParams.get('page') || '1', 10)
    const limit = Number.parseInt(searchParams.get('limit') || '50', 10)

    // Validate pagination parameters
    if (page < 1) {
      return withCors(errorResponse('page must be >= 1'))
    }
    if (limit < 1 || limit > 100) {
      return withCors(errorResponse('limit must be between 1 and 100'))
    }

    // Query is required
    if (!query || query.trim() === '') {
      return withCors(successResponse<PaginatedSearchResult>({
        data: [],
        total: 0,
        page,
        limit,
        total_pages: 0,
      }))
    }

    const offset = (page - 1) * limit

    // Search tasks by name (case-insensitive) - get total count first
    const { data: allTasks, error: countError } = await auth.supabase
      .from('tasks')
      .select('id', { count: 'exact' })
      .eq('user_id', auth.id)
      .ilike('name', `%${query.trim()}%`)

    if (countError) {
      return withCors(errorResponse(countError.message, 500))
    }

    const total = allTasks?.length || 0
    const totalPages = Math.ceil(total / limit)

    // If no results, return empty response
    if (total === 0) {
      return withCors(successResponse<PaginatedSearchResult>({
        data: [],
        total: 0,
        page,
        limit,
        total_pages: 0,
      }))
    }

    // Get paginated tasks
    const { data: tasks, error } = await auth.supabase
      .from('tasks')
      .select('*')
      .eq('user_id', auth.id)
      .ilike('name', `%${query.trim()}%`)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return withCors(errorResponse(error.message, 500))
    }

    // If no tasks found, return empty
    if (!tasks || tasks.length === 0) {
      return withCors(successResponse<PaginatedSearchResult>({
        data: [],
        total,
        page,
        limit,
        total_pages: totalPages,
      }))
    }

    // Get all list and group info for the results
    const listIds = [...new Set(tasks.map(t => t.list_id))]
    const { data: lists } = await auth.supabase
      .from('lists')
      .select('id, name, icon, group_id')
      .in('id', listIds)

    const groupIds = [...new Set(lists?.map(l => l.group_id) || [])]
    const { data: groups } = await auth.supabase
      .from('groups')
      .select('id, name, color')
      .in('id', groupIds)

    // Combine data
    const results: TaskSearchResult[] = tasks.map((task) => {
      const list = lists?.find(l => l.id === task.list_id)
      const group = groups?.find(g => g.id === list?.group_id)
      return {
        ...task,
        list_name: list?.name || 'Unknown List',
        list_icon: list?.icon || '📋',
        group_name: group?.name || 'Unknown Group',
        group_color: group?.color || '#6b7280',
      }
    })

    return withCors(successResponse<PaginatedSearchResult>({
      data: results,
      total,
      page,
      limit,
      total_pages: totalPages,
    }))
  }
  catch (err) {
    console.error('Error searching tasks:', err)
    return withCors(errorResponse('Failed to search tasks', 500))
  }
}
