// API Configuration
// The base URL is bound to each account, defaults to localhost

export const DEFAULT_API_URL = 'http://localhost:3000'

export interface ApiConfig {
  baseUrl: string
  timeout: number
}

// Check if we're in browser dev mode with Vite proxy
function isBrowserDevMode(): boolean {
  if (typeof window === 'undefined')
    return false
  // In dev mode, we use Vite proxy which handles CORS
  // Check if we're on localhost:1420 (Vite dev server)
  const isLocalhost1420 = window.location.hostname === 'localhost' && window.location.port === '1420'
  return isLocalhost1420
}

export function normalizeApiUrl(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

export function isValidApiUrl(url: string): boolean {
  if (!url)
    return false

  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  }
  catch {
    return false
  }
}

// Get the current account's server URL from authStore
// Uses dynamic import to avoid circular dependency
let authStoreGetter: (() => string | null) | null = null

export function setAuthStoreServerUrlGetter(getter: () => string | null): void {
  authStoreGetter = getter
}

export function getCurrentAccountServerUrl(): string | null {
  if (authStoreGetter) {
    return authStoreGetter()
  }
  return null
}

// Temporary API URL for login page (before any account is logged in)
// This is cleared after successful login
let pendingApiUrl: string | null = null

export function setPendingApiUrl(url: string | null): void {
  pendingApiUrl = url
}

export function getPendingApiUrl(): string | null {
  return pendingApiUrl
}

// Get the API URL for current account
export function getApiUrl(): string {
  if (typeof window === 'undefined')
    return DEFAULT_API_URL

  // Priority 1: Use current account's server URL
  const currentAccountServerUrl = getCurrentAccountServerUrl()
  if (currentAccountServerUrl !== null) {
    return currentAccountServerUrl
  }

  // Priority 2: Use pending URL (for login page)
  if (pendingApiUrl !== null) {
    return pendingApiUrl
  }

  // In browser dev mode with no custom URL, use empty string to leverage Vite proxy
  if (isBrowserDevMode()) {
    return ''
  }

  return DEFAULT_API_URL
}

// API client configuration
export const apiConfig: ApiConfig = {
  get baseUrl() {
    return getApiUrl()
  },
  timeout: 30000,
}
