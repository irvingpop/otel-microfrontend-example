import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'

// Mock the telemetry module first
vi.mock('../../lib/telemetry', () => ({
  getOrCreateSessionTrace: vi.fn(),
  trackWidgetActivation: vi.fn(),
  trackWidgetDeactivation: vi.fn(),
  endSessionTrace: vi.fn(),
  telemetryReady: Promise.resolve()
}))

// Mock the SimpleMicrofrontendWrapper to avoid iframe complexity
vi.mock('../SimpleMicrofrontendWrapper', () => ({
  SimpleMicrofrontendWrapper: ({ name }: { name: string }) => (
    <div data-testid={`widget-${name}`}>Mock {name} Widget</div>
  )
}))

// Import after mocking
import { Dashboard } from '../Dashboard'
import * as telemetry from '../../lib/telemetry'

describe('Dashboard Telemetry Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Session Initialization', () => {
    it('should initialize session trace on mount', async () => {
      render(<Dashboard />)

      // Wait for telemetryReady promise and component effects
      await vi.waitFor(() => {
        expect(telemetry.getOrCreateSessionTrace).toHaveBeenCalledTimes(1)
      })
    })

    it('should track initial weather widget activation on mount', async () => {
      render(<Dashboard />)

      // Wait for telemetryReady promise and component effects
      await vi.waitFor(() => {
        expect(telemetry.trackWidgetActivation).toHaveBeenCalledWith('weather')
      })
    })
  })

  describe('Widget Toggle Telemetry', () => {
    it('should track widget activation when toggling on', () => {
      render(<Dashboard />)

      const trafficButton = screen.getByText(/Traffic Monitor/i)
      fireEvent.click(trafficButton)

      expect(telemetry.trackWidgetActivation).toHaveBeenCalledWith('traffic')
    })

    it('should track widget deactivation when toggling off', () => {
      render(<Dashboard />)

      // First toggle on
      const trafficButton = screen.getByText(/Traffic Monitor/i)
      fireEvent.click(trafficButton)

      // Then toggle off
      fireEvent.click(trafficButton)

      expect(telemetry.trackWidgetDeactivation).toHaveBeenCalledWith('traffic')
    })

    it('should track multiple widgets for City Updates button', () => {
      render(<Dashboard />)

      const cityUpdatesButton = screen.getByText(/City Updates/i)
      fireEvent.click(cityUpdatesButton)

      expect(telemetry.trackWidgetActivation).toHaveBeenCalledWith('events')
      expect(telemetry.trackWidgetActivation).toHaveBeenCalledWith('notifications')
    })

    it('should track deactivation for multiple widgets', () => {
      render(<Dashboard />)

      const cityUpdatesButton = screen.getByText(/City Updates/i)

      // First activate
      fireEvent.click(cityUpdatesButton)

      // Then deactivate
      fireEvent.click(cityUpdatesButton)

      expect(telemetry.trackWidgetDeactivation).toHaveBeenCalledWith('events')
      expect(telemetry.trackWidgetDeactivation).toHaveBeenCalledWith('notifications')
    })
  })

  describe('All Widget Types', () => {
    const widgetTestCases = [
      { buttonText: /Traffic Monitor/i, widgetName: 'traffic' },
      { buttonText: /Public Transit/i, widgetName: 'transit' },
      { buttonText: /Energy Grid/i, widgetName: 'energy' },
    ]

    widgetTestCases.forEach(({ buttonText, widgetName }) => {
      it(`should track ${widgetName} widget lifecycle`, () => {
        render(<Dashboard />)

        const button = screen.getByText(buttonText)

        // Activate
        fireEvent.click(button)
        expect(telemetry.trackWidgetActivation).toHaveBeenCalledWith(widgetName)

        // Deactivate
        fireEvent.click(button)
        expect(telemetry.trackWidgetDeactivation).toHaveBeenCalledWith(widgetName)
      })
    })
  })

  describe('Telemetry Call Sequence', () => {
    it('should maintain correct order of telemetry calls', async () => {
      render(<Dashboard />)

      // Wait for initial state
      await vi.waitFor(() => {
        expect(telemetry.getOrCreateSessionTrace).toHaveBeenCalledTimes(1)
        expect(telemetry.trackWidgetActivation).toHaveBeenCalledWith('weather')
      })

      // Toggle traffic on then off
      const trafficButton = screen.getByText(/Traffic Monitor/i)
      fireEvent.click(trafficButton)
      fireEvent.click(trafficButton)

      // Check call sequence
      const activationCalls = (telemetry.trackWidgetActivation as any).mock.calls
      const deactivationCalls = (telemetry.trackWidgetDeactivation as any).mock.calls

      expect(activationCalls).toEqual([
        ['weather'], // Initial
        ['traffic']  // User click
      ])

      expect(deactivationCalls).toEqual([
        ['traffic']  // User click off
      ])
    })
  })

  describe('Widget State Management', () => {
    it('should show widgets when activated and hide when deactivated', () => {
      render(<Dashboard />)

      // Weather should be visible initially
      expect(screen.getByTestId('widget-weather')).toBeInTheDocument()

      // Traffic should not be visible initially
      expect(screen.queryByTestId('widget-traffic')).not.toBeInTheDocument()

      // Toggle traffic on
      const trafficButton = screen.getByText(/Traffic Monitor/i)
      fireEvent.click(trafficButton)

      expect(screen.getByTestId('widget-traffic')).toBeInTheDocument()

      // Toggle traffic off
      fireEvent.click(trafficButton)

      expect(screen.queryByTestId('widget-traffic')).not.toBeInTheDocument()
    })
  })
})
