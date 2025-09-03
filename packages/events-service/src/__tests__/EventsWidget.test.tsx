import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EventsWidget } from '../EventsWidget'

// Mock MicrofrontendTelemetry
vi.mock('../../../shared/microfrontend-telemetry', () => ({
  MicrofrontendTelemetry: vi.fn().mockImplementation(() => ({
    withSpan: vi.fn((name, fn) => fn({ setAttributes: vi.fn() })),
    notifyWidgetLoaded: vi.fn()
  }))
}))

describe('EventsWidget', () => {
  it('renders without crashing', () => {
    render(<EventsWidget />)
    expect(screen.getByText(/Events/)).toBeInTheDocument()
  })
})
