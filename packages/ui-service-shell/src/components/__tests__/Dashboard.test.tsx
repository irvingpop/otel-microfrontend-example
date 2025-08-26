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

  it('renders weather widget by default and control buttons', () => {
    renderDashboard()
    
    // Weather widget should be visible by default
    expect(screen.getByTestId('microfrontend-weather')).toBeInTheDocument()
    
    // Other widgets should NOT be visible by default
    expect(screen.queryByTestId('microfrontend-traffic')).not.toBeInTheDocument()
    expect(screen.queryByTestId('microfrontend-transit')).not.toBeInTheDocument()
    expect(screen.queryByTestId('microfrontend-energy')).not.toBeInTheDocument()
    expect(screen.queryByTestId('microfrontend-events')).not.toBeInTheDocument()
    expect(screen.queryByTestId('microfrontend-notifications')).not.toBeInTheDocument()
    
    // Control buttons should be present
    expect(screen.getByText('🚦 Traffic Monitor')).toBeInTheDocument()
    expect(screen.getByText('🚌 Public Transit')).toBeInTheDocument()
    expect(screen.getByText('⚡ Energy Grid')).toBeInTheDocument()
    expect(screen.getByText('📅 City Updates')).toBeInTheDocument()
  })

  it('has proper dashboard layout classes', () => {
    renderDashboard()
    
    const dashboard = screen.getByText('🏙️ Smart City Dashboard').closest('.dashboard')
    expect(dashboard).toHaveClass('dashboard')
    
    const grid = dashboard?.querySelector('.dashboard-grid')
    expect(grid).toBeInTheDocument()
  })
})