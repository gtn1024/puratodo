import type { User } from '@/lib/api/auth'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

// Register token refresh callback with API client
// This is done after store creation to avoid circular dependencies
import { setRefreshFailedCallback, setTokenRefreshCallback } from '@/lib/api/client'

export interface AccountSession {
  id: string
  user: User
  token: string
  refreshToken: string
  addedAt: string
  lastUsedAt: string
  serverUrl: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  accounts: AccountSession[]
  activeAccountId: string | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setRefreshToken: (refreshToken: string | null) => void
  setLoading: (loading: boolean) => void
  addAccount: (user: User, token: string, refreshToken: string, setActive?: boolean) => void
  switchAccount: (accountId: string) => void
  removeAccount: (accountId: string) => void
  login: (user: User, token: string, refreshToken: string) => void
  logout: () => void
  signOutCurrentAccount: () => void
  getCurrentServerUrl: () => string | null
  setCurrentServerUrl: (url: string | null) => void
  getRefreshToken: () => string | null
}

function syncAuthToken(token: string | null, refreshToken: string | null = null) {
  if (typeof window === 'undefined')
    return
  if (token) {
    localStorage.setItem('authToken', token)
  }
  else {
    localStorage.removeItem('authToken')
  }
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken)
  }
  else {
    localStorage.removeItem('refreshToken')
  }
}

function getActiveAccount(
  accounts: AccountSession[],
  activeAccountId: string | null,
): AccountSession | null {
  if (accounts.length === 0)
    return null
  if (!activeAccountId)
    return accounts[0]
  return accounts.find(account => account.id === activeAccountId) ?? accounts[0]
}

function upsertAccount(
  accounts: AccountSession[],
  user: User,
  token: string,
  refreshToken: string,
  serverUrl: string | null = null,
): AccountSession[] {
  const now = new Date().toISOString()
  const existing = accounts.find(account => account.id === user.id)

  if (!existing) {
    return [
      ...accounts,
      {
        id: user.id,
        user,
        token,
        refreshToken,
        addedAt: now,
        lastUsedAt: now,
        serverUrl,
      },
    ]
  }

  return accounts.map(account =>
    account.id === user.id
      ? {
          ...account,
          user,
          token,
          refreshToken,
          lastUsedAt: now,
          serverUrl: serverUrl !== null ? serverUrl : account.serverUrl,
        }
      : account,
  )
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      accounts: [],
      activeAccountId: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: user =>
        set((state) => {
          if (!state.activeAccountId) {
            return {
              user,
              isAuthenticated: !!user,
            }
          }

          const accounts = state.accounts.map(account =>
            account.id === state.activeAccountId && user
              ? {
                  ...account,
                  user,
                }
              : account,
          )

          return {
            user,
            accounts,
            isAuthenticated: !!user,
          }
        }),

      setToken: (token) => {
        syncAuthToken(token)
        set((state) => {
          if (!state.activeAccountId || !token) {
            return { token }
          }

          const accounts = state.accounts.map(account =>
            account.id === state.activeAccountId
              ? {
                  ...account,
                  token,
                }
              : account,
          )

          return { token, accounts }
        })
      },

      setRefreshToken: (refreshToken) => {
        syncAuthToken(get().token, refreshToken)
        set((state) => {
          if (!state.activeAccountId || !refreshToken) {
            return { refreshToken }
          }

          const accounts = state.accounts.map(account =>
            account.id === state.activeAccountId
              ? {
                  ...account,
                  refreshToken,
                }
              : account,
          )

          return { refreshToken, accounts }
        })
      },

      setLoading: isLoading => set({ isLoading }),

      addAccount: (user, token, refreshToken, setActive = true) =>
        set((state) => {
          const accounts = upsertAccount(state.accounts, user, token, refreshToken)
          const nextActiveId
            = setActive || !state.activeAccountId ? user.id : state.activeAccountId
          const activeAccount = getActiveAccount(accounts, nextActiveId)

          syncAuthToken(activeAccount?.token ?? null, activeAccount?.refreshToken ?? null)

          return {
            accounts,
            activeAccountId: activeAccount?.id ?? null,
            user: activeAccount?.user ?? null,
            token: activeAccount?.token ?? null,
            refreshToken: activeAccount?.refreshToken ?? null,
            isAuthenticated: !!activeAccount,
            isLoading: false,
          }
        }),

      switchAccount: accountId =>
        set((state) => {
          const targetAccount = state.accounts.find(account => account.id === accountId)
          if (!targetAccount)
            return {}

          const now = new Date().toISOString()
          const accounts = state.accounts.map(account =>
            account.id === accountId
              ? {
                  ...account,
                  lastUsedAt: now,
                }
              : account,
          )
          const activeAccount = getActiveAccount(accounts, accountId)

          syncAuthToken(activeAccount?.token ?? null, activeAccount?.refreshToken ?? null)

          return {
            accounts,
            activeAccountId: activeAccount?.id ?? null,
            user: activeAccount?.user ?? null,
            token: activeAccount?.token ?? null,
            refreshToken: activeAccount?.refreshToken ?? null,
            isAuthenticated: !!activeAccount,
          }
        }),

      removeAccount: accountId =>
        set((state) => {
          const accounts = state.accounts.filter(account => account.id !== accountId)
          const activeAccount
            = state.activeAccountId === accountId
              ? getActiveAccount(accounts, null)
              : getActiveAccount(accounts, state.activeAccountId)

          syncAuthToken(activeAccount?.token ?? null, activeAccount?.refreshToken ?? null)

          return {
            accounts,
            activeAccountId: activeAccount?.id ?? null,
            user: activeAccount?.user ?? null,
            token: activeAccount?.token ?? null,
            refreshToken: activeAccount?.refreshToken ?? null,
            isAuthenticated: !!activeAccount,
          }
        }),

      login: (user, token, refreshToken) => {
        get().addAccount(user, token, refreshToken, true)
      },

      logout: () => {
        syncAuthToken(null, null)
        set({
          user: null,
          token: null,
          refreshToken: null,
          accounts: [],
          activeAccountId: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      signOutCurrentAccount: () => {
        const state = get()
        // Remove current account from accounts list
        const remainingAccounts = state.accounts.filter(
          account => account.id !== state.activeAccountId,
        )
        // Get next active account or null
        const nextActiveAccount = remainingAccounts.length > 0 ? remainingAccounts[0] : null

        if (nextActiveAccount) {
          // Switch to next account
          syncAuthToken(nextActiveAccount.token, nextActiveAccount.refreshToken)
          set({
            accounts: remainingAccounts,
            activeAccountId: nextActiveAccount.id,
            user: nextActiveAccount.user,
            token: nextActiveAccount.token,
            refreshToken: nextActiveAccount.refreshToken,
            isAuthenticated: true,
          })
        }
        else {
          // No more accounts, go to login
          syncAuthToken(null, null)
          set({
            user: null,
            token: null,
            refreshToken: null,
            accounts: [],
            activeAccountId: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      getCurrentServerUrl: () => {
        const state = get()
        const activeAccount = getActiveAccount(state.accounts, state.activeAccountId)
        return activeAccount?.serverUrl ?? null
      },

      setCurrentServerUrl: (url: string | null) => {
        set((state) => {
          if (!state.activeAccountId)
            return {}

          const accounts = state.accounts.map(account =>
            account.id === state.activeAccountId
              ? {
                  ...account,
                  serverUrl: url,
                }
              : account,
          )

          return { accounts }
        })
      },

      getRefreshToken: () => {
        const state = get()
        const activeAccount = getActiveAccount(state.accounts, state.activeAccountId)
        return activeAccount?.refreshToken ?? null
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        accounts: state.accounts,
        activeAccountId: state.activeAccountId,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state)
          return

        const activeAccount = getActiveAccount(state.accounts, state.activeAccountId)
        if (activeAccount) {
          state.user = activeAccount.user
          state.token = activeAccount.token
          state.refreshToken = activeAccount.refreshToken
          state.activeAccountId = activeAccount.id
          state.isAuthenticated = true
          syncAuthToken(activeAccount.token, activeAccount.refreshToken)
        }
        else {
          state.user = null
          state.token = null
          state.refreshToken = null
          state.activeAccountId = null
          state.isAuthenticated = false
          syncAuthToken(null, null)
        }

        state.isLoading = false
      },
    },
  ),
)

setTokenRefreshCallback((accessToken: string, refreshToken: string) => {
  const store = useAuthStore.getState()
  // Update the store with new tokens
  store.setToken(accessToken)
  store.setRefreshToken(refreshToken)
})

setRefreshFailedCallback(() => {
  // Refresh token expired or invalid, logout user
  const store = useAuthStore.getState()
  store.logout()
})
