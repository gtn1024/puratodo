import crypto from 'node:crypto'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Auth Middleware for API Token and JWT Authentication
 *
 * This module provides:
 * - Token generation and hashing for API tokens
 * - Token validation (PAT - Personal Access Token)
 * - Dual authentication support (JWT + PAT)
 */

// Token configuration
const TOKEN_PREFIX = 'pt_live_'
const TOKEN_LENGTH = 32 // Random bytes for token
const PREFIX_DISPLAY_LENGTH = 12 // Characters to show in UI

/**
 * Generate a cryptographically secure random token
 * Format: pt_live_{random_string}
 */
export function generateToken(): string {
  const randomBytes = crypto.randomBytes(TOKEN_LENGTH)
  const token = randomBytes.toString('base64url')
  return `${TOKEN_PREFIX}${token}`
}

/**
 * Hash a token using SHA-256 for secure storage
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Extract the display prefix from a token
 * Returns first N characters after the prefix for UI display
 */
export function getTokenPrefix(token: string): string {
  if (!token.startsWith(TOKEN_PREFIX)) {
    throw new Error('Invalid token format')
  }
  const rawPart = token.slice(TOKEN_PREFIX.length)
  return rawPart.slice(0, PREFIX_DISPLAY_LENGTH)
}

/**
 * Validate an API token and return the associated user ID
 *
 * @param token - The raw token string (pt_live_xxx)
 * @returns The user ID if valid, null otherwise
 */
export async function validateApiToken(token: string): Promise<string | null> {
  if (!token || !token.startsWith(TOKEN_PREFIX)) {
    return null
  }

  const tokenHash = hashToken(token)
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('api_tokens')
    .select('user_id, expires_at, revoked_at')
    .eq('token_hash', tokenHash)
    .single()

  if (error || !data) {
    return null
  }

  // Check if token is revoked
  if (data.revoked_at) {
    return null
  }

  // Check if token is expired
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null
  }

  // Update last_used_at asynchronously (don't await)
  supabase
    .from('api_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('token_hash', tokenHash)
    .then(() => {
      // Silently ignore update errors
    })

  return data.user_id
}

/**
 * Get the authenticated user from either JWT session or API token
 *
 * This function supports dual authentication:
 * 1. First tries to get user from Supabase session (JWT)
 * 2. Falls back to Bearer token (PAT) if no session
 *
 * @param request - The incoming request (for header access)
 * @returns The user ID if authenticated, null otherwise
 */
export async function getAuthenticatedUser(
  request?: Request,
): Promise<{ userId: string, authMethod: 'jwt' | 'pat' } | null> {
  // First, try JWT authentication via session
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              )
            }
            catch {
              // Ignore cookie setting errors in middleware
            }
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      return { userId: user.id, authMethod: 'jwt' }
    }
  }
  catch {
    // Session auth failed, try PAT
  }

  // Fall back to PAT (Personal Access Token) authentication
  if (request) {
    const authHeader = request.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const userId = await validateApiToken(token)
      if (userId) {
        return { userId, authMethod: 'pat' }
      }
    }
  }

  return null
}

/**
 * Get the authenticated user ID from request headers only
 * For use in API routes where we have direct access to headers
 */
export async function getAuthenticatedUserIdFromHeaders(
  authHeader: string | null,
): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice(7)
  return validateApiToken(token)
}

/**
 * Create a Supabase client with service role privileges
 * Use this for operations that bypass RLS (e.g., token validation)
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase URL or Service Role Key')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Token scopes type definition
 */
export type TokenScope = 'read' | 'write' | 'admin'

/**
 * Check if a token has a specific scope
 */
export async function checkTokenScope(
  token: string,
  requiredScope: TokenScope,
): Promise<boolean> {
  if (!token || !token.startsWith(TOKEN_PREFIX)) {
    return false
  }

  const tokenHash = hashToken(token)
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('api_tokens')
    .select('scopes, revoked_at, expires_at')
    .eq('token_hash', tokenHash)
    .single()

  if (error || !data) {
    return false
  }

  // Check if token is revoked or expired
  if (data.revoked_at) {
    return false
  }
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return false
  }

  const scopes = data.scopes as TokenScope[]

  // Admin scope includes all permissions
  if (scopes.includes('admin')) {
    return true
  }

  // Write scope includes read
  if (requiredScope === 'read' && (scopes.includes('read') || scopes.includes('write'))) {
    return true
  }

  if (requiredScope === 'write' && scopes.includes('write')) {
    return true
  }

  return scopes.includes(requiredScope)
}
