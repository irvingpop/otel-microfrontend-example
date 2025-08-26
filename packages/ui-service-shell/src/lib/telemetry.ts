import { HoneycombWebSDK } from '@honeycombio/opentelemetry-web'
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web'
import { trace } from '@opentelemetry/api'
import { Span, SpanProcessor } from '@opentelemetry/sdk-trace-base'

const apiKey = import.meta.env.VITE_HONEYCOMB_API_KEY || (globalThis as any).__VITE_HONEYCOMB_API_KEY__ || 'demo-key'

class MicrofrontendSpanProcessor implements SpanProcessor {
  private moduleDetectors: Array<{ name: string, detector: () => boolean }> = [
    {
      name: 'weather-service',
      detector: () => this.isInModule('weather') || this.hasElementWithClass('weather-widget')
    },
    {
      name: 'traffic-service', 
      detector: () => this.isInModule('traffic') || this.hasElementWithClass('traffic-widget')
    },
    {
      name: 'transit-service',
      detector: () => this.isInModule('transit') || this.hasElementWithClass('transit-widget')
    },
    {
      name: 'energy-service',
      detector: () => this.isInModule('energy') || this.hasElementWithClass('energy-widget')
    },
    {
      name: 'events-service',
      detector: () => this.isInModule('events') || this.hasElementWithClass('events-widget')
    },
    {
      name: 'notifications-service',
      detector: () => this.isInModule('notifications') || this.hasElementWithClass('notifications-widget')
    }
  ]

  onStart(span: Span): void {
    const moduleName = this.detectModule()
    if (moduleName) {
      span.setAttributes({
        'microfrontend.module': moduleName,
        'microfrontend.type': 'auto-instrumented'
      })
    }
  }

  onEnd(): void {}
  shutdown(): Promise<void> { return Promise.resolve() }
  forceFlush(): Promise<void> { return Promise.resolve() }

  private detectModule(): string | null {
    for (const detector of this.moduleDetectors) {
      if (detector.detector()) {
        return detector.name
      }
    }
    return null
  }

  private isInModule(moduleName: string): boolean {
    const stack = new Error().stack || ''
    return stack.includes(moduleName) || stack.includes(`${moduleName}Service`)
  }

  private hasElementWithClass(className: string): boolean {
    return document.querySelector(`.${className}`) !== null
  }
}

const sdk = new HoneycombWebSDK({
  apiKey: apiKey,
  serviceName: 'smart-city-dashboard',
  instrumentations: [getWebAutoInstrumentations()],
  spanProcessors: [new MicrofrontendSpanProcessor()]
})

sdk.start()

export const tracer = trace.getTracer('smart-city-dashboard', '1.0.0')

export const createMicrofrontendSpan = (name: string, operation: string) => {
  return tracer.startSpan(`microfrontend.${name}.${operation}`, {
    attributes: {
      'microfrontend.name': name,
      'microfrontend.module': name,
      'microfrontend.operation': operation,
      'microfrontend.type': 'custom',
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

// Export shared tracer and trace API for microfrontends
export { trace } from '@opentelemetry/api'
export const sharedTracer = tracer