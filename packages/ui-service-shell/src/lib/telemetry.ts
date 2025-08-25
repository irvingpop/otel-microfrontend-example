import { HoneycombWebSDK } from '@honeycombio/opentelemetry-web'
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web'
import { trace } from '@opentelemetry/api'

const apiKey = import.meta.env.VITE_HONEYCOMB_API_KEY || (globalThis as any).__VITE_HONEYCOMB_API_KEY__ || 'demo-key'

const sdk = new HoneycombWebSDK({
  apiKey: apiKey,
  serviceName: 'smart-city-dashboard',
  instrumentations: [getWebAutoInstrumentations()]
})

sdk.start()

export const tracer = trace.getTracer('smart-city-dashboard', '1.0.0')

export const createMicrofrontendSpan = (name: string, operation: string) => {
  return tracer.startSpan(`microfrontend.${name}.${operation}`, {
    attributes: {
      'microfrontend.name': name,
      'microfrontend.operation': operation,
      'service.name': 'ui-service-shell'
    }
  })
}

export const trackMicrofrontendLoad = (name: string, loadTimeMs: number) => {
  const span = tracer.startSpan(`microfrontend.${name}.load`)
  span.setAttributes({
    'microfrontend.name': name,
    'microfrontend.load_time_ms': loadTimeMs,
    'microfrontend.status': 'loaded'
  })
  span.end()
}

export const trackMicrofrontendError = (name: string, error: Error) => {
  const span = tracer.startSpan(`microfrontend.${name}.error`)
  span.setAttributes({
    'microfrontend.name': name,
    'microfrontend.error': error.message,
    'microfrontend.status': 'error'
  })
  span.recordException(error)
  span.end()
}