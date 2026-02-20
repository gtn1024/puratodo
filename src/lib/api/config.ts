// API Configuration
// The base URL can be configured in settings, defaults to localhost

export const DEFAULT_API_URL = "http://localhost:3000";
export const API_URL_STORAGE_KEY = "apiUrl";

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
}

// Check if we're in browser dev mode with Vite proxy
function isBrowserDevMode(): boolean {
  if (typeof window === "undefined") return false;
  // In dev mode, we use Vite proxy which handles CORS
  // Check if we're on localhost:1420 (Vite dev server)
  const isLocalhost1420 = window.location.hostname === "localhost" && window.location.port === "1420";
  return isLocalhost1420 && !getStoredApiUrl();
}

export function normalizeApiUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

export function isValidApiUrl(url: string): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function getStoredApiUrl(): string | null {
  if (typeof window === "undefined") return null;

  const storedUrl = localStorage.getItem(API_URL_STORAGE_KEY);
  if (!storedUrl) return null;

  const normalizedUrl = normalizeApiUrl(storedUrl);
  return normalizedUrl.length > 0 ? normalizedUrl : null;
}

// Get the current account's server URL from authStore
// Uses dynamic import to avoid circular dependency
let authStoreGetter: (() => string | null) | null = null;

export function setAuthStoreServerUrlGetter(getter: () => string | null): void {
  authStoreGetter = getter;
}

export function getCurrentAccountServerUrl(): string | null {
  if (authStoreGetter) {
    return authStoreGetter();
  }

  // Fallback: try to get from authStore directly if getter not set
  // This handles the case where authStore is imported before setter is called
  return null;
}

// Get the stored API URL or return default
export function getApiUrl(): string {
  if (typeof window === "undefined") return DEFAULT_API_URL;

  // Priority 1: Use current account's server URL
  const currentAccountServerUrl = getCurrentAccountServerUrl();
  if (currentAccountServerUrl !== null) {
    // In browser dev mode, use empty string to leverage Vite proxy
    if (isBrowserDevMode()) {
      return "";
    }
    return currentAccountServerUrl;
  }

  // Priority 2: Fallback to global stored API URL
  const storedApiUrl = getStoredApiUrl();

  // In browser dev mode, use empty string to leverage Vite proxy
  if (isBrowserDevMode()) {
    return ""; // Use relative URLs through Vite proxy
  }

  return storedApiUrl || DEFAULT_API_URL;
}

// Set the API URL
export function setApiUrl(url: string): void {
  const normalizedUrl = normalizeApiUrl(url);
  localStorage.setItem(API_URL_STORAGE_KEY, normalizedUrl);
}

export function clearApiUrl(): void {
  localStorage.removeItem(API_URL_STORAGE_KEY);
}

// API client configuration
export const apiConfig: ApiConfig = {
  get baseUrl() {
    return getApiUrl();
  },
  timeout: 30000,
};
