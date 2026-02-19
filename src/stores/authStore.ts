import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/lib/api/auth";

export interface AccountSession {
  id: string;
  user: User;
  token: string;
  addedAt: string;
  lastUsedAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  accounts: AccountSession[];
  activeAccountId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  addAccount: (user: User, token: string, setActive?: boolean) => void;
  switchAccount: (accountId: string) => void;
  removeAccount: (accountId: string) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
}

function syncAuthToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("authToken", token);
  } else {
    localStorage.removeItem("authToken");
  }
}

function getActiveAccount(
  accounts: AccountSession[],
  activeAccountId: string | null
): AccountSession | null {
  if (accounts.length === 0) return null;
  if (!activeAccountId) return accounts[0];
  return accounts.find((account) => account.id === activeAccountId) ?? accounts[0];
}

function upsertAccount(
  accounts: AccountSession[],
  user: User,
  token: string
): AccountSession[] {
  const now = new Date().toISOString();
  const existing = accounts.find((account) => account.id === user.id);

  if (!existing) {
    return [
      ...accounts,
      {
        id: user.id,
        user,
        token,
        addedAt: now,
        lastUsedAt: now,
      },
    ];
  }

  return accounts.map((account) =>
    account.id === user.id
      ? {
          ...account,
          user,
          token,
          lastUsedAt: now,
        }
      : account
  );
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      accounts: [],
      activeAccountId: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) =>
        set((state) => {
          if (!state.activeAccountId) {
            return {
              user,
              isAuthenticated: !!user,
            };
          }

          const accounts = state.accounts.map((account) =>
            account.id === state.activeAccountId && user
              ? {
                  ...account,
                  user,
                }
              : account
          );

          return {
            user,
            accounts,
            isAuthenticated: !!user,
          };
        }),

      setToken: (token) => {
        syncAuthToken(token);
        set((state) => {
          if (!state.activeAccountId || !token) {
            return { token };
          }

          const accounts = state.accounts.map((account) =>
            account.id === state.activeAccountId
              ? {
                  ...account,
                  token,
                }
              : account
          );

          return { token, accounts };
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      addAccount: (user, token, setActive = true) =>
        set((state) => {
          const accounts = upsertAccount(state.accounts, user, token);
          const nextActiveId =
            setActive || !state.activeAccountId ? user.id : state.activeAccountId;
          const activeAccount = getActiveAccount(accounts, nextActiveId);

          syncAuthToken(activeAccount?.token ?? null);

          return {
            accounts,
            activeAccountId: activeAccount?.id ?? null,
            user: activeAccount?.user ?? null,
            token: activeAccount?.token ?? null,
            isAuthenticated: !!activeAccount,
            isLoading: false,
          };
        }),

      switchAccount: (accountId) =>
        set((state) => {
          const targetAccount = state.accounts.find((account) => account.id === accountId);
          if (!targetAccount) return {};

          const now = new Date().toISOString();
          const accounts = state.accounts.map((account) =>
            account.id === accountId
              ? {
                  ...account,
                  lastUsedAt: now,
                }
              : account
          );
          const activeAccount = getActiveAccount(accounts, accountId);

          syncAuthToken(activeAccount?.token ?? null);

          return {
            accounts,
            activeAccountId: activeAccount?.id ?? null,
            user: activeAccount?.user ?? null,
            token: activeAccount?.token ?? null,
            isAuthenticated: !!activeAccount,
          };
        }),

      removeAccount: (accountId) =>
        set((state) => {
          const accounts = state.accounts.filter((account) => account.id !== accountId);
          const activeAccount =
            state.activeAccountId === accountId
              ? getActiveAccount(accounts, null)
              : getActiveAccount(accounts, state.activeAccountId);

          syncAuthToken(activeAccount?.token ?? null);

          return {
            accounts,
            activeAccountId: activeAccount?.id ?? null,
            user: activeAccount?.user ?? null,
            token: activeAccount?.token ?? null,
            isAuthenticated: !!activeAccount,
          };
        }),

      login: (user, token) => {
        get().addAccount(user, token, true);
      },

      logout: () => {
        syncAuthToken(null);
        set({
          user: null,
          token: null,
          accounts: [],
          activeAccountId: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        accounts: state.accounts,
        activeAccountId: state.activeAccountId,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        const activeAccount = getActiveAccount(state.accounts, state.activeAccountId);
        if (activeAccount) {
          state.user = activeAccount.user;
          state.token = activeAccount.token;
          state.activeAccountId = activeAccount.id;
          state.isAuthenticated = true;
          syncAuthToken(activeAccount.token);
        } else {
          state.user = null;
          state.token = null;
          state.activeAccountId = null;
          state.isAuthenticated = false;
          syncAuthToken(null);
        }

        state.isLoading = false;
      },
    }
  )
);
