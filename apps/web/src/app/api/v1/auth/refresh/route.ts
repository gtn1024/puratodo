import { createClient } from '@supabase/supabase-js'
import { corsPreflightResponse, errorResponse, successResponse } from '@/lib/api/response'

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { refresh_token } = body

    if (!refresh_token) {
      return errorResponse('Refresh token is required', 400)
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    })

    if (error) {
      return errorResponse(error.message, 401)
    }

    return successResponse({
      access_token: data.session!.access_token,
      refresh_token: data.session!.refresh_token,
      expires_at: data.session!.expires_at,
    })
  }
  catch (err) {
    console.error('Refresh token error:', err)
    return errorResponse('An unexpected error occurred', 500)
  }
}

export async function OPTIONS() {
  return corsPreflightResponse()
}
