import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Simple wrapper for components that need providers
function AllProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options })
}

// Re-export everything
export * from '@testing-library/react'
// Override render method
export { customRender as render }
