import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { Dashboard } from '../Dashboard'

// Mock the SimpleMicrofrontendWrapper to avoid dynamic imports in tests
vi.mock('../SimpleMicrofrontendWrapper', () => ({
  SimpleMicrofrontendWrapper: ({ name, fallback }: { name: string; fallback?: React.ReactNode }) => (
    <div data-testid={`microfrontend-${name}`}>
      {fallback || `Mock ${name} widget`}
    </div>
  )
}))

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  )
}

describe('Dashboard', () => {
  it('renders the main dashboard header', () => {
    renderDashboard()
    
    expect(screen.getByText('🏙️ Smart City Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Real-time city monitoring with OpenTelemetry observability')).toBeInTheDocument()
  })

  it('renders all microfrontend widgets', () => {
    renderDashboard()
    
    expect(screen.getByTestId('microfrontend-weather')).toBeInTheDocument()
    expect(screen.getByTestId('microfrontend-traffic')).toBeInTheDocument()
    expect(screen.getByTestId('microfrontend-transit')).toBeInTheDocument()
    expect(screen.getByTestId('microfrontend-energy')).toBeInTheDocument()
    expect(screen.getByTestId('microfrontend-events')).toBeInTheDocument()
    expect(screen.getByTestId('microfrontend-notifications')).toBeInTheDocument()
  })

  it('has proper dashboard layout classes', () => {
    renderDashboard()
    
    const dashboard = screen.getByText('🏙️ Smart City Dashboard').closest('.dashboard')
    expect(dashboard).toHaveClass('dashboard')
    
    const grid = dashboard?.querySelector('.dashboard-grid')
    expect(grid).toBeInTheDocument()
  })
})