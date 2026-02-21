import { api } from "./client";
import { ApiResponse } from "@puratodo/api-types";

// User types
export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

interface BackendLoginData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: {
    id: string;
    email: string;
    created_at: string;
  };
}

// Auth API endpoints
export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<BackendLoginData>>("/api/v1/auth/login", credentials, false);
    // Transform backend response to frontend format
    return {
      user: {
        id: response.data!.user.id,
        email: response.data!.user.email,
        name: null,
        createdAt: response.data!.user.created_at,
        updatedAt: response.data!.user.created_at,
      },
      token: response.data!.access_token,
      refreshToken: response.data!.refresh_token,
    };
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<BackendLoginData>>("/api/v1/auth/register", credentials, false);
    // Transform backend response to frontend format
    return {
      user: {
        id: response.data!.user.id,
        email: response.data!.user.email,
        name: credentials.name || null,
        createdAt: response.data!.user.created_at,
        updatedAt: response.data!.user.created_at,
      },
      token: response.data!.access_token,
      refreshToken: response.data!.refresh_token,
    };
  },

  async logout(): Promise<void> {
    await api.post("/api/v1/auth/logout");
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<{ id: string; email: string; created_at: string }>>("/api/v1/auth/me");
    return {
      id: response.data!.id,
      email: response.data!.email,
      name: null,
      createdAt: response.data!.created_at,
      updatedAt: response.data!.created_at,
    };
  },

  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    const response = await api.post<ApiResponse<{ access_token: string; refresh_token: string }>>(
      "/api/v1/auth/refresh",
      { refresh_token: refreshToken },
      false // Don't include auth header for refresh
    );
    return {
      token: response.data!.access_token,
      refreshToken: response.data!.refresh_token,
    };
  },
};
