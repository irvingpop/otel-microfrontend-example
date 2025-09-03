import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the OpenTelemetry dependencies first
vi.mock('@opentelemetry/api', () => ({
  trace: {
    getTracer: vi.fn().mockReturnValue({
      startSpan: vi.fn().mockReturnValue({
        setAttributes: vi.fn(),
        end: vi.fn(),
        spanContext: vi.fn().mockReturnValue({
          traceId: 'mock-trace-id',
          spanId: 'mock-span-id'
        })
      }),
    }),
    getActiveSpan: vi.fn(),
    setSpan: vi.fn((context, span) => context),
  },
  context: {
    active: vi.fn().mockReturnValue({}),
    with: vi.fn((context, fn) => fn()),
  },
  propagation: {
    inject: vi.fn(),
  },
}))

vi.mock('@honeycombio/opentelemetry-web', () => ({
  HoneycombWebSDK: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
  })),
}))

vi.mock('@opentelemetry/auto-instrumentations-web', () => ({
  getWebAutoInstrumentations: vi.fn().mockReturnValue([]),
}))

// Mock the shared telemetry config
vi.mock('../../../../shared/telemetry-config', () => {
  const mockSpan = {
    setAttributes: vi.fn(),
    end: vi.fn(),
    spanContext: vi.fn().mockReturnValue({
      traceId: 'mock-trace-id',
      spanId: 'mock-span-id'
    })
  }

  const mockTracer = {
    startSpan: vi.fn().mockReturnValue(mockSpan)
  }

  return {
    initializeTelemetry: vi.fn(),
    getServiceTracer: vi.fn().mockReturnValue(mockTracer),
  }
})

// Import after mocking
import { getOrCreateSessionTrace, trackWidgetActivation, trackWidgetDeactivation, trackWidgetLoaded } from '../telemetry'
import { getServiceTracer } from '../../../../shared/telemetry-config'

describe('Telemetry', () => {
  let mockTracer: any

  beforeEach(() => {
    vi.clearAllMocks()
      // Reset any session state
      ; (global as any).sessionTrace = null
    // Get the mocked tracer
    mockTracer = getServiceTracer('test')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Session Management', () => {
    it('should create a session trace on first call', () => {
      getOrCreateSessionTrace()

      expect(mockTracer.startSpan).toHaveBeenCalledWith('dashboard.session', {
        attributes: expect.objectContaining({
          'session.type': 'dashboard',
          'service.name': 'ui-service-shell',
          'session.start_time': expect.any(Number),
        })
      })
    })

    it('should return the same session trace on subsequent calls', () => {
      const trace1 = getOrCreateSessionTrace()
      const trace2 = getOrCreateSessionTrace()

      expect(trace1).toBe(trace2)
      expect(mockTracer.startSpan).toHaveBeenCalledTimes(1)
    })
  })

  describe('Widget Lifecycle Tracking', () => {
    it('should track widget activation with correct service name and attributes', () => {
      trackWidgetActivation('traffic')

      expect(mockTracer.startSpan).toHaveBeenCalledWith('traffic.activate', {
        parent: expect.any(Object),
        attributes: {
          'service.name': 'traffic-service',
          'microfrontend.service': 'traffic-service',
          'microfrontend.operation': 'activate'
        }
      })

      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        'widget.name': 'traffic',
        'widget.action': 'activate',
        'widget.timestamp': expect.any(Number)
      })

      expect(mockSpan.end).toHaveBeenCalled()
    })

    it('should track widget deactivation with correct service name and attributes', () => {
      trackWidgetDeactivation('energy')

      expect(mockTracer.startSpan).toHaveBeenCalledWith('energy.deactivate', {
        parent: expect.any(Object),
        attributes: {
          'service.name': 'energy-service',
          'microfrontend.service': 'energy-service',
          'microfrontend.operation': 'deactivate'
        }
      })

      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        'widget.name': 'energy',
        'widget.action': 'deactivate',
        'widget.timestamp': expect.any(Number)
      })

      expect(mockSpan.end).toHaveBeenCalled()
    })

    it('should track widget loaded event with data attributes', () => {
      const mockData = {
        routes_count: 4,
        overall_status: 'moderate',
        incidents: 2
      }

      trackWidgetLoaded('traffic', mockData)

      expect(mockTracer.startSpan).toHaveBeenCalledWith('traffic.loaded', {
        parent: expect.any(Object),
        attributes: {
          'service.name': 'traffic-service',
          'microfrontend.service': 'traffic-service',
          'microfrontend.operation': 'loaded'
        }
      })

      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        'widget.name': 'traffic',
        'widget.action': 'loaded',
        'widget.timestamp': expect.any(Number),
        'widget.routes_count': 4,
        'widget.overall_status': 'moderate',
        'widget.incidents': 2
      })

      expect(mockSpan.end).toHaveBeenCalled()
    })
  })

  describe('Service Name Mapping', () => {
    const testCases = [
      ['weather', 'weather-service'],
      ['traffic', 'traffic-service'],
      ['transit', 'transit-service'],
      ['energy', 'energy-service'],
      ['events', 'events-service'],
      ['notifications', 'notifications-service'],
      ['unknown', 'ui-service-shell']
    ]

    testCases.forEach(([widgetName, expectedServiceName]) => {
      it(`should map ${widgetName} to ${expectedServiceName}`, () => {
        trackWidgetActivation(widgetName)

        expect(mockTracer.startSpan).toHaveBeenCalledWith(
          `${widgetName}.activate`,
          expect.objectContaining({
            attributes: expect.objectContaining({
              'service.name': expectedServiceName,
              'microfrontend.service': expectedServiceName
            })
          })
        )
      })
    })
  })

  describe('Span Hierarchy', () => {
    it('should create child spans under the session trace', () => {
      const sessionTrace = getOrCreateSessionTrace()
      trackWidgetActivation('weather')

      // First call creates session trace
      expect(mockTracer.startSpan).toHaveBeenNthCalledWith(1, 'dashboard.session', expect.any(Object))

      // Second call creates widget activation span with session as parent
      expect(mockTracer.startSpan).toHaveBeenNthCalledWith(2, 'weather.activate', {
        parent: sessionTrace,
        attributes: expect.objectContaining({
          'service.name': 'weather-service'
        })
      })
    })

    it('should maintain span hierarchy across multiple widget operations', () => {
      const sessionTrace = getOrCreateSessionTrace()

      trackWidgetActivation('traffic')
      trackWidgetLoaded('traffic', { test: 'data' })
      trackWidgetDeactivation('traffic')

      // All spans should have the session as parent
      expect(mockTracer.startSpan).toHaveBeenNthCalledWith(2, 'traffic.activate', {
        parent: sessionTrace,
        attributes: expect.any(Object)
      })

      expect(mockTracer.startSpan).toHaveBeenNthCalledWith(3, 'traffic.loaded', {
        parent: sessionTrace,
        attributes: expect.any(Object)
      })

      expect(mockTracer.startSpan).toHaveBeenNthCalledWith(4, 'traffic.deactivate', {
        parent: sessionTrace,
        attributes: expect.any(Object)
      })
    })
  })
})
