import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TrafficWidget } from '../TrafficWidget'

// Mock MicrofrontendTelemetry
vi.mock('../../../shared/microfrontend-telemetry', () => ({
  MicrofrontendTelemetry: vi.fn().mockImplementation(() => ({
    withSpan: vi.fn((_name, fn) => fn({ setAttributes: vi.fn() })),
    notifyWidgetLoaded: vi.fn()
  }))
}))

describe('TrafficWidget', () => {
  it('renders without crashing', async () => {
    render(<TrafficWidget />)
    // First shows loading state
    expect(screen.getByText(/Loading/)).toBeTruthy()
    // Then shows traffic content - use getAllByText since there are multiple matches
    const trafficElements = await screen.findAllByText(/Traffic/)
    expect(trafficElements.length).toBeGreaterThan(0)
  })
})
