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
import { getOrCreateInboxListForUser } from '@/lib/inbox'
import { parseRecurrenceFields } from '@/lib/recurrence'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return corsPreflightResponse()
}

// GET /api/v1/tasks/inbox - Get inbox tasks with optional filters
export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request.headers.get('Authorization'))

  if (!auth) {
    return withCors(unauthorizedResponse())
  }

  try {
    const inboxList = await getOrCreateInboxListForUser(auth.supabase, auth.id)
    if (!inboxList) {
      return withCors(errorResponse('Failed to resolve inbox list', 500))
    }

    const { searchParams } = new URL(request.url)
    const completed = searchParams.get('completed')
    const starred = searchParams.get('starred')
    const parentId = searchParams.get('parent_id')

    let query = auth.supabase
      .from('tasks')
      .select('*')
      .eq('user_id', auth.id)
      .eq('list_id', inboxList.id)
      .order('sort_order', { ascending: true })

    if (completed !== null) {
      query = query.eq('completed', completed === 'true')
    }

    if (starred !== null) {
      query = query.eq('starred', starred === 'true')
    }

    if (parentId !== null) {
      if (parentId === 'null' || parentId === '') {
        query = query.is('parent_id', null)
      }
      else {
        query = query.eq('parent_id', parentId)
      }
    }

    const { data, error } = await query
    if (error) {
      return withCors(errorResponse(error.message, 500))
    }

    return withCors(successResponse<Task[]>(data || []))
  }
  catch (err) {
    console.error('Error fetching inbox tasks:', err)
    return withCors(errorResponse('Failed to fetch inbox tasks', 500))
  }
}

// POST /api/v1/tasks/inbox - Create a new inbox task
export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request.headers.get('Authorization'))

  if (!auth) {
    return withCors(unauthorizedResponse())
  }

  try {
    const inboxList = await getOrCreateInboxListForUser(auth.supabase, auth.id)
    if (!inboxList) {
      return withCors(errorResponse('Failed to resolve inbox list', 500))
    }

    const body = await request.json()
    const {
      parent_id,
      name,
      completed,
      starred,
      due_date,
      plan_date,
      comment,
      duration_minutes,
    } = body

    const recurrenceResult = parseRecurrenceFields(body as Record<string, unknown>)
    if (recurrenceResult.error) {
      return withCors(errorResponse(recurrenceResult.error))
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return withCors(errorResponse('Name is required'))
    }

    if (parent_id) {
      const { data: parentTask, error: parentError } = await auth.supabase
        .from('tasks')
        .select('id, list_id')
        .eq('id', parent_id)
        .eq('user_id', auth.id)
        .single()

      if (parentError || !parentTask) {
        return withCors(errorResponse('Parent task not found', 404))
      }

      if (parentTask.list_id !== inboxList.id) {
        return withCors(errorResponse('Parent task must be in Inbox'))
      }
    }

    let sortQuery = auth.supabase
      .from('tasks')
      .select('sort_order')
      .eq('list_id', inboxList.id)
      .eq('user_id', auth.id)

    if (parent_id) {
      sortQuery = sortQuery.eq('parent_id', parent_id)
    }
    else {
      sortQuery = sortQuery.is('parent_id', null)
    }

    const { data: existingTasks } = await sortQuery
      .order('sort_order', { ascending: false })
      .limit(1)

    const maxOrder = existingTasks?.[0]?.sort_order ?? -1

    const { data, error } = await auth.supabase
      .from('tasks')
      .insert({
        user_id: auth.id,
        list_id: inboxList.id,
        parent_id: parent_id || null,
        name: name.trim(),
        completed: completed ?? false,
        starred: starred ?? false,
        due_date: due_date || null,
        plan_date: plan_date || null,
        comment: comment || null,
        duration_minutes: duration_minutes || null,
        ...recurrenceResult.data,
        sort_order: maxOrder + 1,
      })
      .select()
      .single()

    if (error) {
      return withCors(errorResponse(error.message, 500))
    }

    return withCors(successResponse<Task>(data, 201))
  }
  catch (err) {
    console.error('Error creating inbox task:', err)
    return withCors(errorResponse('Failed to create inbox task', 500))
  }
}
