import { useState, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { authApi, type LoginCredentials, type RegisterCredentials } from "@/lib/api/auth";
import { ApiException } from "@/lib/api/client";

interface UseAuthReturn {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (credentials: RegisterCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const { login: setLogin, logout: setLogout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.login(credentials);
      setLogin(response.user, response.token);
      return { success: true };
    } catch (err) {
      const message =
        err instanceof ApiException
          ? err.message
          : "An error occurred during login";
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [setLogin]);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.register(credentials);
      setLogin(response.user, response.token);
      return { success: true };
    } catch (err) {
      const message =
        err instanceof ApiException
          ? err.message
          : "An error occurred during registration";
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [setLogin]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch {
      // Ignore logout API errors, still clear local state
    } finally {
      setLogout();
      setIsLoading(false);
    }
  }, [setLogout]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    login,
    register,
    logout,
    isLoading,
    error,
    clearError,
  };
}
