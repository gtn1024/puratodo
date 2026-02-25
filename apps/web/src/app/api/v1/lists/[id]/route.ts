import type { NextRequest } from 'next/server'
import type { List } from '../route'
import { getAuthenticatedUser } from '@/lib/api/auth'
import {
  corsPreflightResponse,
  errorResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
  withCors,
} from '@/lib/api/response'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return corsPreflightResponse()
}

// GET /api/v1/lists/[id] - Get a single list by ID
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
    const { data, error } = await auth.supabase
      .from('lists')
      .select('*')
      .eq('id', id)
      .eq('user_id', auth.id)
      .single()

    if (error || !data) {
      return withCors(notFoundResponse('List not found'))
    }

    return withCors(successResponse<List>(data))
  }
  catch (err) {
    console.error('Error fetching list:', err)
    return withCors(errorResponse('Failed to fetch list', 500))
  }
}

// PATCH /api/v1/lists/[id] - Update a list
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
    const body = await request.json()
    const { name, icon } = body

    // At least one field must be provided
    if (name === undefined && icon === undefined) {
      return withCors(errorResponse('At least one field (name or icon) must be provided'))
    }

    const updateData: { name?: string, icon?: string | null } = {}
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return withCors(errorResponse('Name must be a non-empty string'))
      }
      updateData.name = name.trim()
    }
    if (icon !== undefined) {
      updateData.icon = icon || null
    }

    // First check if the list exists and belongs to the user
    const { data: existingList, error: fetchError } = await auth.supabase
      .from('lists')
      .select('id')
      .eq('id', id)
      .eq('user_id', auth.id)
      .single()

    if (fetchError || !existingList) {
      return withCors(notFoundResponse('List not found'))
    }

    const { data, error } = await auth.supabase
      .from('lists')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', auth.id)
      .select()
      .single()

    if (error) {
      return withCors(errorResponse(error.message, 500))
    }

    return withCors(successResponse<List>(data))
  }
  catch (err) {
    console.error('Error updating list:', err)
    return withCors(errorResponse('Failed to update list', 500))
  }
}

// DELETE /api/v1/lists/[id] - Delete a list
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
    // First check if the list exists and belongs to the user
    const { data: existingList, error: fetchError } = await auth.supabase
      .from('lists')
      .select('id')
      .eq('id', id)
      .eq('user_id', auth.id)
      .single()

    if (fetchError || !existingList) {
      return withCors(notFoundResponse('List not found'))
    }

    const { error } = await auth.supabase
      .from('lists')
      .delete()
      .eq('id', id)
      .eq('user_id', auth.id)

    if (error) {
      return withCors(errorResponse(error.message, 500))
    }

    return withCors(successResponse({ id }))
  }
  catch (err) {
    console.error('Error deleting list:', err)
    return withCors(errorResponse('Failed to delete list', 500))
  }
}
