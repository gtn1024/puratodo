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

// Get auth token from storage
function getAuthToken(): string | null {
  return localStorage.getItem("authToken");
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

// API client object with methods for different HTTP verbs
export const api = {
  async get<T>(path: string, includeAuth = true): Promise<T> {
    const response = await fetch(buildUrl(path), {
      method: "GET",
      headers: getHeaders(includeAuth),
    });

    return handleResponse<T>(response);
  },

  async post<T>(path: string, body?: unknown, includeAuth = true): Promise<T> {
    const response = await fetch(buildUrl(path), {
      method: "POST",
      headers: getHeaders(includeAuth),
      body: body ? JSON.stringify(body) : undefined,
    });

    return handleResponse<T>(response);
  },

  async put<T>(path: string, body?: unknown, includeAuth = true): Promise<T> {
    const response = await fetch(buildUrl(path), {
      method: "PUT",
      headers: getHeaders(includeAuth),
      body: body ? JSON.stringify(body) : undefined,
    });

    return handleResponse<T>(response);
  },

  async patch<T>(path: string, body?: unknown, includeAuth = true): Promise<T> {
    const response = await fetch(buildUrl(path), {
      method: "PATCH",
      headers: getHeaders(includeAuth),
      body: body ? JSON.stringify(body) : undefined,
    });

    return handleResponse<T>(response);
  },

  async delete<T>(path: string, includeAuth = true): Promise<T> {
    const response = await fetch(buildUrl(path), {
      method: "DELETE",
      headers: getHeaders(includeAuth),
    });

    return handleResponse<T>(response);
  },
};
