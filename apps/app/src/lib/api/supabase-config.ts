// Supabase configuration API
// Fetches Supabase config from the server for realtime sync

import { getApiUrl } from "./config";
import { getAuthToken } from "./client";

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

let cachedConfig: SupabaseConfig | null = null;

export async function fetchSupabaseConfig(): Promise<SupabaseConfig | null> {
  const token = getAuthToken();
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${getApiUrl()}/api/v1/supabase-config`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn("Unauthorized to fetch Supabase config");
        return null;
      }
      throw new Error(`Failed to fetch Supabase config: ${response.statusText}`);
    }

    const data = await response.json();
    cachedConfig = {
      supabaseUrl: data.supabaseUrl,
      supabaseAnonKey: data.supabaseAnonKey,
    };
    return cachedConfig;
  } catch (error) {
    console.error("Error fetching Supabase config:", error);
    return null;
  }
}

export function getCachedSupabaseConfig(): SupabaseConfig | null {
  return cachedConfig;
}

export function clearSupabaseConfig(): void {
  cachedConfig = null;
}
