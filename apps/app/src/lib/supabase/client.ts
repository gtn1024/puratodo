// Supabase client for Tauri app
// Uses config fetched from server

import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'
import { getAuthToken } from '@/lib/api/client'
import {
  clearSupabaseConfig,
  fetchSupabaseConfig,
} from '@/lib/api/supabase-config'

let supabaseClient: SupabaseClient | null = null

export async function initializeSupabaseClient(): Promise<SupabaseClient | null> {
  // Check if already initialized
  if (supabaseClient) {
    return supabaseClient
  }

  // Get config from server
  const config = await fetchSupabaseConfig()
  if (!config) {
    console.warn('Failed to fetch Supabase config')
    return null
  }

  // Get current auth token
  const token = getAuthToken()
  if (!token) {
    console.warn('No auth token available')
    return null
  }

  // Create Supabase client
  supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: false, // We manage auth ourselves via API
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })

  return supabaseClient
}

export function getSupabaseClient(): SupabaseClient | null {
  return supabaseClient
}

export function clearSupabaseClient(): void {
  supabaseClient = null
  clearSupabaseConfig()
}

// Re-initialize client with new auth token
export async function reinitializeSupabaseClient(): Promise<SupabaseClient | null> {
  clearSupabaseClient()
  return await initializeSupabaseClient()
}
