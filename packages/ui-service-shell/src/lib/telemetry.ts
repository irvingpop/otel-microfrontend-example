import { initializeTelemetry, getServiceTracer } from '../../../shared/telemetry-config'
import { trace, propagation, context } from '@opentelemetry/api'

// Initialize telemetry for the entire application (only in shell)
initializeTelemetry({
  serviceName: 'smart-city-dashboard',  // Main app service name
  debug: true
})

// Export the initialization promise for components to wait on
export const telemetryReady = new Promise<void>((resolve) => {
  // Wait for page to be fully loaded and telemetry to be initialized
  if (document.readyState === 'complete') {
    resolve()
  } else {
    window.addEventListener('load', () => resolve())
  }
})

export const tracer = getServiceTracer('ui-service-shell', '1.0.0')

// Session-level trace management
let sessionTrace: any = null
let sessionEnded = false // Track if session trace has ended
const widgetStates = new Map<string, boolean>() // Track which widgets have been activated

export const getOrCreateSessionTrace = () => {
  if (!sessionTrace || sessionEnded) {
    // Reset ended flag
    sessionEnded = false

    // Get the active span - this should be from page load instrumentation
    const activeSpan = trace.getActiveSpan()
    console.log('🍯 Active span when creating session:', activeSpan)

    // Create session span as a child of the current context
    // The SingleTraceSpanProcessor will ensure it's part of the main trace
    sessionTrace = tracer.startSpan('dashboard.session', {
      attributes: {
        'session.start_time': Date.now(),
        'session.type': 'dashboard',
        'service.name': 'ui-service-shell'
      }
    })

    console.log('🍯 Created session span:', {
      traceId: sessionTrace.spanContext().traceId,
      spanId: sessionTrace.spanContext().spanId,
      activeSpan: activeSpan ? activeSpan.spanContext() : 'none'
    })

    // Set up cleanup when page unloads
    const cleanup = () => {
      if (sessionTrace && !sessionEnded) {
        console.log('🍯 Ending session span on beforeunload')
        sessionTrace.end()
        sessionEnded = true
        sessionTrace = null
      }
    }

    window.addEventListener('beforeunload', cleanup)
    window.addEventListener('unload', cleanup)
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
  // Prevent duplicate activation events
  if (widgetStates.get(widgetName)) {
    return // Widget already activated
  }
  widgetStates.set(widgetName, true)

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
  // Reset widget state on deactivation
  widgetStates.set(widgetName, false)

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

// Track loaded widgets to prevent duplicates
const loadedWidgets = new Set<string>()

export const trackWidgetLoaded = (widgetName: string, data: Record<string, any>) => {
  // Prevent duplicate loaded events for the same widget
  const loadKey = `${widgetName}_${JSON.stringify(data)}`
  if (loadedWidgets.has(loadKey)) {
    return // Already tracked this exact load
  }
  loadedWidgets.add(loadKey)

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
  // Create the span within the session context
  const sessionContext = sessionTrace ? trace.setSpan(context.active(), sessionTrace) : context.active()

  context.with(sessionContext, () => {
    const span = tracer.startSpan(`microfrontend.${name}.load`)
    span.setAttributes({
      'microfrontend.name': name,
      'microfrontend.load_time_ms': loadTimeMs,
      'microfrontend.status': 'loaded'
    })
    span.end()
  })
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

// Clean up session trace
export const endSessionTrace = () => {
  if (sessionTrace && !sessionEnded) {
    console.log('🍯 Ending session span manually')
    const startTime = sessionTrace._startTime || Date.now()
    sessionTrace.setAttributes({
      'session.end_time': Date.now(),
      'session.duration_ms': Date.now() - startTime
    })
    sessionTrace.end()
    sessionEnded = true
    sessionTrace = null
    widgetStates.clear()
    loadedWidgets.clear()
  }
}
