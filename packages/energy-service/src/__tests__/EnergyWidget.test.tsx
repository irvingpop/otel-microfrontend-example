import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EnergyWidget } from '../EnergyWidget'

// Mock MicrofrontendTelemetry
vi.mock('../../../shared/microfrontend-telemetry', () => ({
  MicrofrontendTelemetry: vi.fn().mockImplementation(() => ({
    withSpan: vi.fn((name, fn) => fn({ setAttributes: vi.fn() })),
    notifyWidgetLoaded: vi.fn()
  }))
}))

describe('EnergyWidget', () => {
  it('renders without crashing', () => {
    render(<EnergyWidget />)
    expect(screen.getByText(/Energy/)).toBeTruthy()
  })
})
