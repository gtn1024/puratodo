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

// PATCH /api/v1/groups/reorder - Reorder groups
export async function PATCH(request: NextRequest) {
  const auth = await getAuthenticatedUser(request.headers.get('Authorization'))

  if (!auth) {
    return withCors(unauthorizedResponse())
  }

  try {
    const body = await request.json()
    const { groupIds } = body

    if (!Array.isArray(groupIds) || groupIds.length === 0) {
      return withCors(errorResponse('groupIds must be a non-empty array'))
    }

    // Validate all IDs are strings
    if (!groupIds.every(id => typeof id === 'string')) {
      return withCors(errorResponse('All group IDs must be strings'))
    }

    // Verify all groups belong to the user
    const { data: userGroups, error: fetchError } = await auth.supabase
      .from('groups')
      .select('id')
      .eq('user_id', auth.id)

    if (fetchError) {
      return withCors(errorResponse(fetchError.message, 500))
    }

    const userGroupIds = new Set(userGroups?.map(g => g.id) || [])
    const invalidIds = groupIds.filter(id => !userGroupIds.has(id))

    if (invalidIds.length > 0) {
      return withCors(errorResponse('Some group IDs do not exist or do not belong to you'))
    }

    // Update sort_order for each group
    const updates = groupIds.map((id, index) =>
      auth.supabase
        .from('groups')
        .update({ sort_order: index })
        .eq('id', id)
        .eq('user_id', auth.id),
    )

    const results = await Promise.all(updates)
    const errors = results.filter(r => r.error)

    if (errors.length > 0) {
      return withCors(errorResponse(errors[0].error?.message || 'Failed to reorder groups', 500))
    }

    return withCors(successResponse({ reordered: groupIds.length }))
  }
  catch (err) {
    console.error('Error reordering groups:', err)
    return withCors(errorResponse('Failed to reorder groups', 500))
  }
}
