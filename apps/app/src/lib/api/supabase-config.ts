// Supabase configuration API
// Fetches Supabase config from the server for realtime sync

import { api } from './client'

export interface SupabaseConfig {
  supabaseUrl: string
  supabaseAnonKey: string
}

let cachedConfig: SupabaseConfig | null = null

export async function fetchSupabaseConfig(): Promise<SupabaseConfig | null> {
  try {
    const data = await api.get<{ supabaseUrl: string, supabaseAnonKey: string }>(
      '/api/v1/supabase-config',
    )

    cachedConfig = {
      supabaseUrl: data.supabaseUrl,
      supabaseAnonKey: data.supabaseAnonKey,
    }
    return cachedConfig
  }
  catch (error) {
    console.error('Error fetching Supabase config:', error)
    return null
  }
}

export function getCachedSupabaseConfig(): SupabaseConfig | null {
  return cachedConfig
}

export function clearSupabaseConfig(): void {
  cachedConfig = null
}
