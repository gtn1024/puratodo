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

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return corsPreflightResponse()
}

// GET /api/v1/tasks/starred - Get all starred tasks
export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request.headers.get('Authorization'))

  if (!auth) {
    return withCors(unauthorizedResponse())
  }

  try {
    const { data, error } = await auth.supabase
      .from('tasks')
      .select('*')
      .eq('user_id', auth.id)
      .eq('starred', true)
      .order('updated_at', { ascending: false })

    if (error) {
      return withCors(errorResponse(error.message, 500))
    }

    return withCors(successResponse<Task[]>(data || []))
  }
  catch (err) {
    console.error('Error fetching starred tasks:', err)
    return withCors(errorResponse('Failed to fetch starred tasks', 500))
  }
}
