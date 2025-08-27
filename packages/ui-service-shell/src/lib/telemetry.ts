import { initializeTelemetry, getServiceTracer } from '../../../shared/telemetry-config'
import { trace, propagation, context } from '@opentelemetry/api'

// Initialize telemetry for the shell service
initializeTelemetry({
  serviceName: 'ui-service-shell',
  debug: true
})

export const tracer = getServiceTracer('ui-service-shell', '1.0.0')

// Session-level trace management
let sessionTrace: any = null

export const getOrCreateSessionTrace = () => {
  if (!sessionTrace) {
    sessionTrace = tracer.startSpan('dashboard.session', {
      attributes: {
        'session.start_time': Date.now(),
        'session.type': 'dashboard',
        'service.name': 'ui-service-shell'
      }
    })
  }
  return sessionTrace
}

// Service-specific span creation with proper attribution
const createServiceSpan = (serviceName: string, operation: string, parentContext?: any) => {
  const activeContext = parentContext || context.active()
  return context.with(activeContext, () => {
    const span = tracer.startSpan(`${serviceName.replace('-service', '')}.${operation}`, {
      attributes: {
        'service.name': serviceName,
        'microfrontend.service': serviceName,
        'microfrontend.operation': operation
      }
    })
    return span
  })
}

// Helper to determine service name based on microfrontend module
const getServiceNameForModule = (moduleName: string): string => {
  const serviceMapping: Record<string, string> = {
    'weather': 'weather-service',
    'traffic': 'traffic-service', 
    'transit': 'transit-service',
    'energy': 'energy-service',
    'events': 'events-service',
    'notifications': 'notifications-service'
  }
  return serviceMapping[moduleName] || 'ui-service-shell'
}

// Widget lifecycle management
export const trackWidgetActivation = (widgetName: string) => {
  const sessionTrace = getOrCreateSessionTrace()
  const serviceName = getServiceNameForModule(widgetName)
  
  const sessionContext = trace.setSpan(context.active(), sessionTrace)
  const span = createServiceSpan(serviceName, 'activate', sessionContext)
  span.setAttributes({
    'widget.name': widgetName,
    'widget.action': 'activate',
    'widget.timestamp': Date.now()
  })
  span.end()
  
  return span
}

export const trackWidgetDeactivation = (widgetName: string) => {
  const sessionTrace = getOrCreateSessionTrace()
  const serviceName = getServiceNameForModule(widgetName)
  
  const sessionContext = trace.setSpan(context.active(), sessionTrace)
  const span = createServiceSpan(serviceName, 'deactivate', sessionContext)
  span.setAttributes({
    'widget.name': widgetName,
    'widget.action': 'deactivate',
    'widget.timestamp': Date.now()
  })
  span.end()
  
  return span
}

export const trackWidgetLoaded = (widgetName: string, data: Record<string, any>) => {
  const sessionTrace = getOrCreateSessionTrace()
  const serviceName = getServiceNameForModule(widgetName)
  
  const sessionContext = trace.setSpan(context.active(), sessionTrace)
  const span = createServiceSpan(serviceName, 'loaded', sessionContext)
  span.setAttributes({
    'widget.name': widgetName,
    'widget.action': 'loaded',
    'widget.timestamp': Date.now(),
    ...Object.keys(data).reduce((acc, key) => ({
      ...acc,
      [`widget.${key}`]: data[key]
    }), {})
  })
  span.end()
  
  return span
}

export const createMicrofrontendSpan = (name: string, operation: string) => {
  const sessionTrace = getOrCreateSessionTrace()
  const serviceName = getServiceNameForModule(name)
  return createServiceSpan(serviceName, operation, sessionTrace)
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
    'microfrontend.module': name,
    'microfrontend.error': error.message,
    'microfrontend.status': 'error',
    'microfrontend.type': 'custom'
  })
  span.recordException(error)
  span.end()
}

// Shared utilities for microfrontends
export const createModuleTracer = (moduleName: string, version: string = '1.0.0') => {
  return trace.getTracer(`microfrontend.${moduleName}`, version)
}

export const trackModuleRender = (moduleName: string, renderTimeMs: number, componentName?: string) => {
  const span = tracer.startSpan(`microfrontend.${moduleName}.render`)
  span.setAttributes({
    'microfrontend.module': moduleName,
    'microfrontend.operation': 'render',
    'microfrontend.render_time_ms': renderTimeMs,
    'microfrontend.type': 'custom',
    ...(componentName && { 'microfrontend.component': componentName })
  })
  span.end()
}

export const trackModuleInteraction = (moduleName: string, interactionType: string, target?: string) => {
  const span = tracer.startSpan(`microfrontend.${moduleName}.interaction`)
  span.setAttributes({
    'microfrontend.module': moduleName,
    'microfrontend.operation': 'interaction',
    'microfrontend.interaction_type': interactionType,
    'microfrontend.type': 'custom',
    ...(target && { 'microfrontend.interaction_target': target })
  })
  span.end()
}

// Trace context propagation for iframes
export const getTraceContext = () => {
  const headers: Record<string, string> = {}
  propagation.inject(context.active(), headers)
  return headers
}

export const createIframeSpan = (name: string, operation: string, serviceName: string) => {
  return tracer.startSpan(`${serviceName.replace('-service', '')}.${operation}`, {
    attributes: {
      'microfrontend.name': name,
      'microfrontend.module': name,
      'microfrontend.operation': operation,
      'microfrontend.type': 'iframe',
      'service.name': serviceName
    }
  })
}

// Export shared tracer and trace API for microfrontends
export { trace } from '@opentelemetry/api'
export const sharedTracer = tracer