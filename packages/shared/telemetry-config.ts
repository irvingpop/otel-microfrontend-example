import { HoneycombWebSDK } from '@honeycombio/opentelemetry-web'
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web'
import { trace, propagation, context } from '@opentelemetry/api'

export interface TelemetryConfig {
  serviceName: string
  apiKey?: string
  debug?: boolean
}

let initialized = false

export const initializeTelemetry = (config: TelemetryConfig) => {
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
    instrumentations: [getWebAutoInstrumentations()],
    debug
  })

  sdk.start()
  initialized = true

  if (debug) {
    console.log(`🍯 Telemetry initialized for ${config.serviceName}`)
  }
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