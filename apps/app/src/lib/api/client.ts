import { getApiUrl } from "./config";

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

// Internal client response wrapper
export interface ClientResponse<T> {
  data: T | null;
  error: ApiError | null;
}

// Custom error class for API errors
export class ApiException extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiException";
    this.status = status;
    this.errors = errors;
  }
}

// Special error to indicate token refresh needed
export class TokenExpiredError extends ApiException {
  constructor() {
    super("Token expired", 401);
    this.name = "TokenExpiredError";
  }
}

// Callback for token refresh - set by authStore
let onTokenRefreshed: ((accessToken: string, refreshToken: string) => void) | null = null;
let onRefreshFailed: (() => void) | null = null;

export function setTokenRefreshCallback(
  callback: (accessToken: string, refreshToken: string) => void
): void {
  onTokenRefreshed = callback;
}

export function setRefreshFailedCallback(callback: () => void): void {
  onRefreshFailed = callback;
}

// Get auth token from storage
function getAuthToken(): string | null {
  return localStorage.getItem("authToken");
}

// Get refresh token from storage
function getRefreshToken(): string | null {
  return localStorage.getItem("refreshToken");
}

// Update tokens in storage
function updateTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem("authToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
}

// Build full URL with path
function buildUrl(path: string): string {
  const baseUrl = getApiUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

// Default headers for API requests
function getHeaders(includeAuth = true): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
}

// Handle API response
async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  if (!response.ok) {
    let errorMessage = "An error occurred";
    let errors: Record<string, string[]> | undefined;

    if (isJson) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        errors = errorData.errors;
      } catch {
        // Ignore JSON parse errors
      }
    } else {
      errorMessage = response.statusText || errorMessage;
    }

    throw new ApiException(errorMessage, response.status, errors);
  }

  if (isJson) {
    return response.json();
  }

  return {} as T;
}

// Refresh token state to prevent multiple refresh requests
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  // If already refreshing, wait for the existing refresh
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch(buildUrl("/api/v1/auth/refresh"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      if (data.success && data.data) {
        updateTokens(data.data.access_token, data.data.refresh_token);
        // Notify authStore about the new tokens
        if (onTokenRefreshed) {
          onTokenRefreshed(data.data.access_token, data.data.refresh_token);
        }
        return true;
      }

      return false;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Make a fetch request with automatic token refresh on 401
async function fetchWithRefresh(
  url: string,
  options: RequestInit,
  includeAuth: boolean
): Promise<Response> {
  const response = await fetch(url, options);

  // If 401 and we have auth, try to refresh token and retry
  if (response.status === 401 && includeAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry with new token
      const newHeaders = getHeaders(true);
      return fetch(url, {
        ...options,
        headers: newHeaders,
      });
    } else {
      // Refresh failed, notify authStore to logout
      if (onRefreshFailed) {
        onRefreshFailed();
      }
    }
  }

  return response;
}

// API client object with methods for different HTTP verbs
export const api = {
  async get<T>(path: string, includeAuth = true): Promise<T> {
    const response = await fetchWithRefresh(
      buildUrl(path),
      {
        method: "GET",
        headers: getHeaders(includeAuth),
      },
      includeAuth
    );

    return handleResponse<T>(response);
  },

  async post<T>(path: string, body?: unknown, includeAuth = true): Promise<T> {
    const response = await fetchWithRefresh(
      buildUrl(path),
      {
        method: "POST",
        headers: getHeaders(includeAuth),
        body: body ? JSON.stringify(body) : undefined,
      },
      includeAuth
    );

    return handleResponse<T>(response);
  },

  async put<T>(path: string, body?: unknown, includeAuth = true): Promise<T> {
    const response = await fetchWithRefresh(
      buildUrl(path),
      {
        method: "PUT",
        headers: getHeaders(includeAuth),
        body: body ? JSON.stringify(body) : undefined,
      },
      includeAuth
    );

    return handleResponse<T>(response);
  },

  async patch<T>(path: string, body?: unknown, includeAuth = true): Promise<T> {
    const response = await fetchWithRefresh(
      buildUrl(path),
      {
        method: "PATCH",
        headers: getHeaders(includeAuth),
        body: body ? JSON.stringify(body) : undefined,
      },
      includeAuth
    );

    return handleResponse<T>(response);
  },

  async delete<T>(path: string, includeAuth = true): Promise<T> {
    const response = await fetchWithRefresh(
      buildUrl(path),
      {
        method: "DELETE",
        headers: getHeaders(includeAuth),
      },
      includeAuth
    );

    return handleResponse<T>(response);
  },
};
