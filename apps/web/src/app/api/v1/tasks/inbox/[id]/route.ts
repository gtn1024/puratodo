import type { NextRequest } from 'next/server'
import type { Task } from '../../route'
import { getAuthenticatedUser } from '@/lib/api/auth'
import {
  corsPreflightResponse,
  errorResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
  withCors,
} from '@/lib/api/response'
import { getOrCreateInboxListForUser } from '@/lib/inbox'
import { parseRecurrenceFields } from '@/lib/recurrence'
import {
  isValidRecurrenceUpdateScope,
  updateTaskWithRecurrenceHandling,
} from '@/lib/recurrence-runtime'

// Helper to recursively fetch inbox subtasks
async function getInboxSubtasksRecursively(
  supabase: ReturnType<typeof getAuthenticatedUser> extends Promise<infer T>
    ? T extends { supabase: infer S }
      ? S
      : never
    : never,
  userId: string,
  inboxListId: string,
  parentId: string,
): Promise<Task[]> {
  const { data: subtasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('list_id', inboxListId)
    .eq('parent_id', parentId)
    .order('sort_order', { ascending: true })

  if (error || !subtasks) {
    return []
  }

  const tasksWithSubtasks = await Promise.all(
    subtasks.map(async (task) => {
      const nestedSubtasks = await getInboxSubtasksRecursively(
        supabase,
        userId,
        inboxListId,
        task.id,
      )
      return { ...task, subtasks: nestedSubtasks }
    }),
  )

  return tasksWithSubtasks as Task[]
}

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return corsPreflightResponse()
}

// GET /api/v1/tasks/inbox/[id] - Get a single inbox task by ID with subtasks
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthenticatedUser(request.headers.get('Authorization'))

  if (!auth) {
    return withCors(unauthorizedResponse())
  }

  const { id } = await params

  try {
    const inboxList = await getOrCreateInboxListForUser(auth.supabase, auth.id)
    if (!inboxList) {
      return withCors(errorResponse('Failed to resolve inbox list', 500))
    }

    const { data, error } = await auth.supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .eq('user_id', auth.id)
      .eq('list_id', inboxList.id)
      .single()

    if (error || !data) {
      return withCors(notFoundResponse('Inbox task not found'))
    }

    const subtasks = await getInboxSubtasksRecursively(
      auth.supabase,
      auth.id,
      inboxList.id,
      id,
    )

    return withCors(successResponse<Task>({ ...data, subtasks }))
  }
  catch (err) {
    console.error('Error fetching inbox task:', err)
    return withCors(errorResponse('Failed to fetch inbox task', 500))
  }
}

// PATCH /api/v1/tasks/inbox/[id] - Update an inbox task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthenticatedUser(request.headers.get('Authorization'))

  if (!auth) {
    return withCors(unauthorizedResponse())
  }

  const { id } = await params

  try {
    const inboxList = await getOrCreateInboxListForUser(auth.supabase, auth.id)
    if (!inboxList) {
      return withCors(errorResponse('Failed to resolve inbox list', 500))
    }

    const body = await request.json()
    const {
      name,
      completed,
      starred,
      due_date,
      plan_date,
      comment,
      duration_minutes,
    } = body

    const recurrenceScopeRaw = body.recurrence_update_scope
    if (
      recurrenceScopeRaw !== undefined
      && !isValidRecurrenceUpdateScope(recurrenceScopeRaw)
    ) {
      return withCors(
        errorResponse('recurrence_update_scope must be one of: single, future'),
      )
    }

    const updateData: Record<string, unknown> = {}

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return withCors(errorResponse('Name must be a non-empty string'))
      }
      updateData.name = name.trim()
    }
    if (completed !== undefined) {
      updateData.completed = Boolean(completed)
    }
    if (starred !== undefined) {
      updateData.starred = Boolean(starred)
    }
    if (due_date !== undefined) {
      updateData.due_date = due_date || null
    }
    if (plan_date !== undefined) {
      updateData.plan_date = plan_date || null
    }
    if (comment !== undefined) {
      updateData.comment = comment || null
    }
    if (duration_minutes !== undefined) {
      updateData.duration_minutes = duration_minutes
        ? Number(duration_minutes)
        : null
    }

    const recurrenceResult = parseRecurrenceFields(
      body as Record<string, unknown>,
      { partial: true },
    )
    if (recurrenceResult.error) {
      return withCors(errorResponse(recurrenceResult.error))
    }
    Object.assign(updateData, recurrenceResult.data)

    if (Object.keys(updateData).length === 0) {
      return withCors(errorResponse('At least one field must be provided'))
    }

    const result = await updateTaskWithRecurrenceHandling({
      supabase: auth.supabase,
      userId: auth.id,
      taskId: id,
      listId: inboxList.id,
      patch: {
        ...updateData,
        recurrence_update_scope: recurrenceScopeRaw,
      },
    })

    if (result.status === 404) {
      return withCors(notFoundResponse(result.error || 'Inbox task not found'))
    }

    if (result.error || !result.task) {
      return withCors(errorResponse(result.error || 'Failed to update inbox task', 500))
    }

    return withCors(successResponse<Task>(result.task))
  }
  catch (err) {
    console.error('Error updating inbox task:', err)
    return withCors(errorResponse('Failed to update inbox task', 500))
  }
}

// DELETE /api/v1/tasks/inbox/[id] - Delete an inbox task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthenticatedUser(request.headers.get('Authorization'))

  if (!auth) {
    return withCors(unauthorizedResponse())
  }

  const { id } = await params

  try {
    const inboxList = await getOrCreateInboxListForUser(auth.supabase, auth.id)
    if (!inboxList) {
      return withCors(errorResponse('Failed to resolve inbox list', 500))
    }

    const { data: existingTask, error: fetchError } = await auth.supabase
      .from('tasks')
      .select('id')
      .eq('id', id)
      .eq('user_id', auth.id)
      .eq('list_id', inboxList.id)
      .single()

    if (fetchError || !existingTask) {
      return withCors(notFoundResponse('Inbox task not found'))
    }

    const { error } = await auth.supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', auth.id)
      .eq('list_id', inboxList.id)

    if (error) {
      return withCors(errorResponse(error.message, 500))
    }

    return withCors(successResponse({ id }))
  }
  catch (err) {
    console.error('Error deleting inbox task:', err)
    return withCors(errorResponse('Failed to delete inbox task', 500))
  }
}
