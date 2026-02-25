import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/api/auth'

// Routes that don't require authentication
const publicRoutes = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only handle /api/v1/* routes
  if (!pathname.startsWith('/api/v1')) {
    return NextResponse.next()
  }

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  // Allow public routes without authentication
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    const response = NextResponse.next()
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }

  // Verify authentication for protected routes
  const authHeader = request.headers.get('Authorization')
  const user = await verifyToken(authHeader)

  if (!user) {
    const response = NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    )
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization',
    )
    return response
  }

  // Add user info to headers for downstream handlers
  const response = NextResponse.next()
  response.headers.set('x-user-id', user.id)
  response.headers.set('x-user-email', user.email)
  response.headers.set('Access-Control-Allow-Origin', '*')

  return response
}

export const config = {
  proxy: '/api/v1/:path*',
}
