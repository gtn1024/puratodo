// API Configuration
// The base URL can be configured in settings, defaults to localhost

export const DEFAULT_API_URL = "http://localhost:3000";

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
  return isLocalhost1420 && !localStorage.getItem("apiUrl");
}

// Get the stored API URL or return default
export function getApiUrl(): string {
  if (typeof window === "undefined") return DEFAULT_API_URL;

  // In browser dev mode, use empty string to leverage Vite proxy
  if (isBrowserDevMode()) {
    return ""; // Use relative URLs through Vite proxy
  }

  return localStorage.getItem("apiUrl") || DEFAULT_API_URL;
}

// Set the API URL
export function setApiUrl(url: string): void {
  localStorage.setItem("apiUrl", url);
}

// API client configuration
export const apiConfig: ApiConfig = {
  get baseUrl() {
    return getApiUrl();
  },
  timeout: 30000,
};
