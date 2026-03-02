'use server'

import type { ApiToken } from '@puratodo/api-types'
import { revalidatePath } from 'next/cache'
import {
  createServiceClient,
  generateToken,
  getTokenPrefix,
  hashToken,
} from '@/lib/auth-middleware'
import { createClient } from '@/lib/supabase/server'

/**
 * Token response type - includes raw token only on creation
 */
export interface TokenWithRaw extends Omit<ApiToken, 'token_hash'> {
  raw_token?: string // Only returned once during creation
}

/**
 * Get all active (non-revoked) API tokens for the current user
 */
export async function listApiTokens(): Promise<ApiToken[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('api_tokens')
    .select('id, user_id, name, prefix, scopes, created_at, last_used_at, expires_at, revoked_at')
    .eq('user_id', user.id)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching API tokens:', error)
    return []
  }

  return (data || []) as ApiToken[]
}

/**
 * Create a new API token
 * Returns the raw token ONCE - it cannot be retrieved again
 */
export async function createApiToken(
  name: string,
  scopes: string[] = ['read', 'write'],
  expiresInDays?: number,
): Promise<{ success: boolean, token?: TokenWithRaw, error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Validate name
  if (!name || name.trim().length === 0) {
    return { success: false, error: 'Token name is required' }
  }

  // Generate token
  const rawToken = generateToken()
  const tokenHash = hashToken(rawToken)
  const prefix = getTokenPrefix(rawToken)

  // Calculate expiration date if provided
  let expiresAt: string | null = null
  if (expiresInDays && expiresInDays > 0) {
    const expDate = new Date()
    expDate.setDate(expDate.getDate() + expiresInDays)
    expiresAt = expDate.toISOString()
  }

  // Use service client to insert (bypasses RLS for token_hash field)
  const serviceClient = createServiceClient()

  const { data, error } = await serviceClient
    .from('api_tokens')
    .insert({
      user_id: user.id,
      name: name.trim(),
      token_hash: tokenHash,
      prefix,
      scopes,
      expires_at: expiresAt,
    })
    .select('id, user_id, name, prefix, scopes, created_at, last_used_at, expires_at, revoked_at')
    .single()

  if (error) {
    console.error('Error creating API token:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/settings/tokens')

  return {
    success: true,
    token: {
      ...data,
      raw_token: rawToken, // Return raw token ONCE
    } as TokenWithRaw,
  }
}

/**
 * Revoke an API token (soft delete)
 * Sets revoked_at timestamp - token will no longer work for authentication
 */
export async function revokeApiToken(
  tokenId: string,
): Promise<{ success: boolean, error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('api_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', tokenId)
    .eq('user_id', user.id) // Ensure user owns the token

  if (error) {
    console.error('Error revoking API token:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/settings/tokens')
  return { success: true }
}

/**
 * Delete an API token permanently (hard delete)
 */
export async function deleteApiToken(
  tokenId: string,
): Promise<{ success: boolean, error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('api_tokens')
    .delete()
    .eq('id', tokenId)
    .eq('user_id', user.id) // Ensure user owns the token

  if (error) {
    console.error('Error deleting API token:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/settings/tokens')
  return { success: true }
}

/**
 * Get a single API token by ID
 */
export async function getApiToken(tokenId: string): Promise<ApiToken | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('api_tokens')
    .select('id, user_id, name, prefix, scopes, created_at, last_used_at, expires_at, revoked_at')
    .eq('id', tokenId)
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('Error fetching API token:', error)
    return null
  }

  return data as ApiToken
}

/**
 * Update token name
 */
export async function updateApiToken(
  tokenId: string,
  data: { name?: string },
): Promise<{ success: boolean, error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) {
    if (!data.name || data.name.trim().length === 0) {
      return { success: false, error: 'Token name is required' }
    }
    updateData.name = data.name.trim()
  }

  const { error } = await supabase
    .from('api_tokens')
    .update(updateData)
    .eq('id', tokenId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating API token:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/settings/tokens')
  return { success: true }
}
