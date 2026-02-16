// API Configuration
// The base URL can be configured in settings, defaults to localhost

export const DEFAULT_API_URL = "http://localhost:3000";

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
}

// Get the stored API URL or return default
export function getApiUrl(): string {
  if (typeof window === "undefined") return DEFAULT_API_URL;
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
