import { useState, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { authApi, type LoginCredentials, type RegisterCredentials } from "@/lib/api/auth";
import { ApiException } from "@/lib/api/client";
import { getPendingApiUrl, setPendingApiUrl } from "@/lib/api/config";

interface UseAuthReturn {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (credentials: RegisterCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  signOutCurrentAccount: () => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const { login: setLogin, logout: setLogout, signOutCurrentAccount, setCurrentServerUrl } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.login(credentials);

      // Get the pending API URL before login completes
      const pendingUrl = getPendingApiUrl();

      setLogin(response.user, response.token);

      // If there was a pending API URL, bind it to the new account
      if (pendingUrl !== null) {
        setCurrentServerUrl(pendingUrl);
        setPendingApiUrl(null);
      }

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
  }, [setLogin, setCurrentServerUrl]);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.register(credentials);

      // Get the pending API URL before registration completes
      const pendingUrl = getPendingApiUrl();

      setLogin(response.user, response.token);

      // If there was a pending API URL, bind it to the new account
      if (pendingUrl !== null) {
        setCurrentServerUrl(pendingUrl);
        setPendingApiUrl(null);
      }

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
  }, [setLogin, setCurrentServerUrl]);

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
    signOutCurrentAccount,
    isLoading,
    error,
    clearError,
  };
}
