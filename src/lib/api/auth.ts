import { api } from "./client";

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
}

// Auth API endpoints
export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/api/auth/login", credentials, false);
    return response;
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/api/auth/register", credentials, false);
    return response;
  },

  async logout(): Promise<void> {
    await api.post("/api/auth/logout");
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>("/api/auth/me");
    return response;
  },

  async refreshToken(): Promise<{ token: string }> {
    const response = await api.post<{ token: string }>("/api/auth/refresh");
    return response;
  },
};
