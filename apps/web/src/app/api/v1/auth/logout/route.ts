import { createClient } from '@supabase/supabase-js'
import { corsPreflightResponse, errorResponse, successResponse } from '@/lib/api/response'

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user and invalidate session
 *     tags: [Auth]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refresh_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { refresh_token } = body

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    // If refresh_token is provided, sign out with that scope
    if (refresh_token) {
      const { error } = await supabase.auth.admin.signOut(refresh_token)
      if (error) {
        return errorResponse(error.message, 400)
      }
    }
    else {
      // Sign out all sessions for the user if no specific token
      await supabase.auth.signOut({ scope: 'global' })
    }

    return successResponse({ message: 'Logged out successfully' })
  }
  catch (err) {
    console.error('Logout error:', err)
    return errorResponse('An unexpected error occurred', 500)
  }
}

export async function OPTIONS() {
  return corsPreflightResponse()
}
