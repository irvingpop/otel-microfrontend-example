import { HoneycombWebSDK } from '@honeycombio/opentelemetry-web'
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web'
import { trace, propagation, context } from '@opentelemetry/api'
import { SingleTraceSpanProcessor } from './single-trace-processor'

export interface TelemetryConfig {
  serviceName: string
  apiKey?: string
  debug?: boolean
}

let initialized = false

// Check if we're running inside an iframe (microfrontend)
export const isInMicrofrontend = () => {
  try {
    return window.self !== window.top
  } catch (e) {
    // If we can't access window.top due to cross-origin, we're in an iframe
    return true
  }
}

export const initializeTelemetry = (config: TelemetryConfig) => {
  // Don't initialize telemetry in microfrontends - only in the shell
  if (isInMicrofrontend()) {
    console.log(`🍯 Skipping telemetry initialization for ${config.serviceName} - running in microfrontend`)
    return
  }

  if (initialized) {
    return
  }

  const apiKey = config.apiKey ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_HONEYCOMB_API_KEY) ||
    (globalThis as any).__VITE_HONEYCOMB_API_KEY__ ||
    'demo-key'

  const debug = config.debug ??
    ((typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEBUG_TELEMETRY === 'true') ||
      false)

  const sdk = new HoneycombWebSDK({
    apiKey,
    serviceName: config.serviceName,
    instrumentations: [getWebAutoInstrumentations({
      // Disable auto-instrumentations that create their own traces
      '@opentelemetry/instrumentation-xml-http-request': {
        propagateTraceHeaderCorsUrls: /.*/,
        clearTimingResources: true
      },
      '@opentelemetry/instrumentation-fetch': {
        propagateTraceHeaderCorsUrls: /.*/,
        clearTimingResources: true
      },
      '@opentelemetry/instrumentation-document-load': {
        enabled: true
      },
      '@opentelemetry/instrumentation-user-interaction': {
        enabled: true
      }
    })],
    spanProcessors: [new SingleTraceSpanProcessor()],
    debug
  })

  sdk.start()
  initialized = true

  console.log(`🍯 Telemetry initialized for ${config.serviceName}`, {
    apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'none',
    isDemo: apiKey === 'demo-key',
    debug
  })
}

export const getServiceTracer = (serviceName: string, version: string = '1.0.0') => {
  return trace.getTracer(serviceName, version)
}

// Trace context utilities for cross-iframe communication
export const getTraceContext = () => {
  const headers: Record<string, string> = {}
  propagation.inject(context.active(), headers)
  return headers
}

export const setTraceContext = (headers: Record<string, string>) => {
  return propagation.extract(context.active(), headers)
}

// PostMessage helpers with trace context
export const postMessageWithTrace = (target: Window, message: any) => {
  const traceContext = getTraceContext()
  target.postMessage({
    ...message,
    traceContext
  }, '*')
}

export const extractTraceFromMessage = (message: any) => {
  if (message.traceContext) {
    return setTraceContext(message.traceContext)
  }
  return context.active()
}
