import type { NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api/auth'
import {
  corsPreflightResponse,
  errorResponse,
  successResponse,
  unauthorizedResponse,
  withCors,
} from '@/lib/api/response'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return corsPreflightResponse()
}

// PATCH /api/v1/tasks/reorder - Reorder tasks within a list
export async function PATCH(request: NextRequest) {
  const auth = await getAuthenticatedUser(request.headers.get('Authorization'))

  if (!auth) {
    return withCors(unauthorizedResponse())
  }

  try {
    const body = await request.json()
    const { taskIds, list_id, parent_id } = body

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return withCors(errorResponse('taskIds must be a non-empty array'))
    }

    if (!list_id || typeof list_id !== 'string') {
      return withCors(errorResponse('list_id is required'))
    }

    // Validate all IDs are strings
    if (!taskIds.every(id => typeof id === 'string')) {
      return withCors(errorResponse('All task IDs must be strings'))
    }

    // Verify the list belongs to the user
    const { data: list, error: listError } = await auth.supabase
      .from('lists')
      .select('id')
      .eq('id', list_id)
      .eq('user_id', auth.id)
      .single()

    if (listError || !list) {
      return withCors(errorResponse('List not found or does not belong to you', 404))
    }

    // Verify all tasks belong to the user and the specified list
    let query = auth.supabase
      .from('tasks')
      .select('id')
      .eq('list_id', list_id)
      .eq('user_id', auth.id)

    if (parent_id) {
      query = query.eq('parent_id', parent_id)
    }
    else {
      query = query.is('parent_id', null)
    }

    const { data: userTasks, error: fetchError } = await query

    if (fetchError) {
      return withCors(errorResponse(fetchError.message, 500))
    }

    const userTaskIds = new Set(userTasks?.map(t => t.id) || [])
    const invalidIds = taskIds.filter(id => !userTaskIds.has(id))

    if (invalidIds.length > 0) {
      return withCors(errorResponse('Some task IDs do not exist or do not belong to you in this context'))
    }

    // Update sort_order for each task
    const updates = taskIds.map((id, index) => {
      let q = auth.supabase
        .from('tasks')
        .update({ sort_order: index })
        .eq('id', id)
        .eq('list_id', list_id)
        .eq('user_id', auth.id)

      if (parent_id) {
        q = q.eq('parent_id', parent_id)
      }
      else {
        q = q.is('parent_id', null)
      }

      return q
    })

    const results = await Promise.all(updates)
    const errors = results.filter(r => r.error)

    if (errors.length > 0) {
      return withCors(errorResponse(errors[0].error?.message || 'Failed to reorder tasks', 500))
    }

    return withCors(successResponse({ reordered: taskIds.length }))
  }
  catch (err) {
    console.error('Error reordering tasks:', err)
    return withCors(errorResponse('Failed to reorder tasks', 500))
  }
}
