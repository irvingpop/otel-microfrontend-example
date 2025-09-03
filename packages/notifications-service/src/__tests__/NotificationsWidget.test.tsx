import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NotificationsWidget } from '../NotificationsWidget'

// Mock MicrofrontendTelemetry
vi.mock('../../../shared/microfrontend-telemetry', () => ({
  MicrofrontendTelemetry: vi.fn().mockImplementation(() => ({
    withSpan: vi.fn((name, fn) => fn({ setAttributes: vi.fn() })),
    notifyWidgetLoaded: vi.fn()
  }))
}))

describe('NotificationsWidget', () => {
  it('renders without crashing', () => {
    render(<NotificationsWidget />)
    expect(screen.getByText(/Notifications/)).toBeInTheDocument()
  })
})
