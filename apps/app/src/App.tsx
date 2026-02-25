import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { RestAdapterProvider } from './adapters/RestAdapterProvider'
import { useI18n } from './i18n'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import './App.css'

type AuthPage = 'login' | 'register'

function App() {
  const { t } = useI18n()
  const { isAuthenticated, isLoading } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)
  const [authPage, setAuthPage] = useState<AuthPage>('login')

  // Wait for Zustand to hydrate from localStorage
  useEffect(() => {
    // Small delay to ensure hydration is complete
    const timer = setTimeout(() => {
      setIsHydrated(true)
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  // Show loading state while hydrating
  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-stone-800 to-stone-600 dark:from-stone-100 dark:to-stone-300 flex items-center justify-center animate-pulse">
            <svg className="w-6 h-6 text-white dark:text-stone-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-400">{t('app.loading')}</p>
        </div>
      </div>
    )
  }

  // Show auth pages if not authenticated
  if (!isAuthenticated) {
    if (authPage === 'register') {
      return <RegisterPage onSwitchToLogin={() => setAuthPage('login')} />
    }
    return <LoginPage onSwitchToRegister={() => setAuthPage('register')} />
  }

  // Show dashboard if authenticated
  return (
    <RestAdapterProvider>
      <DashboardPage />
    </RestAdapterProvider>
  )
}

export default App
