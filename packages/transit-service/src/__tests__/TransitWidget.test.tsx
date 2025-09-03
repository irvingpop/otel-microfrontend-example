import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TransitWidget } from '../TransitWidget'

// Mock MicrofrontendTelemetry
vi.mock('../../../shared/microfrontend-telemetry', () => ({
  MicrofrontendTelemetry: vi.fn().mockImplementation(() => ({
    withSpan: vi.fn((name, fn) => fn({ setAttributes: vi.fn() })),
    notifyWidgetLoaded: vi.fn()
  }))
}))

describe('TransitWidget', () => {
  it('renders without crashing', async () => {
    render(<TransitWidget />)
    // Wait for content to load
    const transitText = await screen.findByText(/Transit/)
    expect(transitText).toBeTruthy()
  })
})
