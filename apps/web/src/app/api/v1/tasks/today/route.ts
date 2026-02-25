import type { NextRequest } from 'next/server'
import type { Task } from '../route'
import { getAuthenticatedUser } from '@/lib/api/auth'
import {
  corsPreflightResponse,
  errorResponse,
  successResponse,
  unauthorizedResponse,
  withCors,
} from '@/lib/api/response'

export type TaskWithListInfo = Task & {
  list_name: string
  list_icon: string
  group_name: string
  group_color: string
}

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return corsPreflightResponse()
}

// GET /api/v1/tasks/today - Get tasks with plan_date = today
export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request.headers.get('Authorization'))

  if (!auth) {
    return withCors(unauthorizedResponse())
  }

  try {
    // Get today's date in local YYYY-MM-DD format (avoiding timezone issues)
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    // Get tasks with plan_date = today
    const { data: tasks, error } = await auth.supabase
      .from('tasks')
      .select('*')
      .eq('user_id', auth.id)
      .eq('plan_date', today)
      .order('sort_order', { ascending: true })

    if (error) {
      return withCors(errorResponse(error.message, 500))
    }

    if (!tasks || tasks.length === 0) {
      return withCors(successResponse<TaskWithListInfo[]>([]))
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
    const results: TaskWithListInfo[] = tasks.map((task) => {
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

    return withCors(successResponse<TaskWithListInfo[]>(results))
  }
  catch (err) {
    console.error('Error fetching today\'s tasks:', err)
    return withCors(errorResponse('Failed to fetch today\'s tasks', 500))
  }
}
