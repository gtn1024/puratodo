import type { NextRequest } from 'next/server'
import type { List } from '../../route'
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

// PATCH /api/v1/lists/[id]/move - Move a list to a different group
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
    const { group_id } = body

    if (!group_id || typeof group_id !== 'string') {
      return withCors(errorResponse('group_id is required'))
    }

    // Verify the list exists and belongs to the user
    const { data: existingList, error: listError } = await auth.supabase
      .from('lists')
      .select('id, group_id')
      .eq('id', id)
      .eq('user_id', auth.id)
      .single()

    if (listError || !existingList) {
      return withCors(notFoundResponse('List not found'))
    }

    // Verify the target group exists and belongs to the user
    const { data: targetGroup, error: groupError } = await auth.supabase
      .from('groups')
      .select('id')
      .eq('id', group_id)
      .eq('user_id', auth.id)
      .single()

    if (groupError || !targetGroup) {
      return withCors(errorResponse('Target group not found or does not belong to you', 404))
    }

    // If already in the same group, no need to move
    if (existingList.group_id === group_id) {
      return withCors(successResponse({ message: 'List is already in the target group' }))
    }

    // Get max sort_order for target group
    const { data: existingLists } = await auth.supabase
      .from('lists')
      .select('sort_order')
      .eq('group_id', group_id)
      .eq('user_id', auth.id)
      .order('sort_order', { ascending: false })
      .limit(1)

    const maxOrder = existingLists?.[0]?.sort_order ?? -1

    const { data, error } = await auth.supabase
      .from('lists')
      .update({ group_id, sort_order: maxOrder + 1 })
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
    console.error('Error moving list:', err)
    return withCors(errorResponse('Failed to move list', 500))
  }
}
