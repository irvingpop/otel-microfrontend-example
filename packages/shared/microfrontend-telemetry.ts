import { trace, context, propagation, Context } from '@opentelemetry/api'
import { getServiceTracer } from './telemetry-config'

// Shared utility for microfrontends to handle trace context propagation
export class MicrofrontendTelemetry {
  private parentContext: Context | null = null
  private tracer: ReturnType<typeof trace.getTracer>
  private serviceName: string

  constructor(serviceName: string, version: string = '1.0.0') {
    this.serviceName = serviceName
    this.tracer = getServiceTracer(serviceName, version)
    this.setupTraceContextListener()
  }

  private setupTraceContextListener() {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'TRACE_CONTEXT_INIT') {
        console.log(`🍯 ${this.serviceName} received trace context:`, {
          traceId: event.data.traceId,
          spanId: event.data.spanId
        })

        if (event.data.traceContext) {
          // Extract the trace context from the headers
          this.parentContext = propagation.extract(context.active(), event.data.traceContext)
          console.log(`🍯 ${this.serviceName} extracted parent context from headers`)
        }
      }
    }

    window.addEventListener('message', handleMessage)
  }

  // Create a span within the parent context
  startSpan(name: string, attributes?: Record<string, any>) {
    const activeContext = this.parentContext || context.active()

    return context.with(activeContext, () => {
      const span = this.tracer.startSpan(name)

      if (attributes) {
        span.setAttributes({
          'service.name': this.serviceName,
          ...attributes
        })
      } else {
        span.setAttribute('service.name', this.serviceName)
      }

      return span
    })
  }

  // Execute a function within the parent context
  withContext<T>(fn: () => T): T {
    const activeContext = this.parentContext || context.active()
    return context.with(activeContext, fn)
  }

  // Create a span and execute a function within it
  withSpan<T>(name: string, fn: (span: any) => T): T {
    const span = this.startSpan(name)
    try {
      const result = fn(span)
      span.end()
      console.log(`🍯 Ended ${name} span`)
      return result
    } catch (error) {
      span.recordException(error as Error)
      span.end()
      throw error
    }
  }

  // Send widget loaded event to parent
  notifyWidgetLoaded(_widgetType: string, data: Record<string, any>) {
    window.parent.postMessage({
      type: 'WIDGET_LOADED',
      service: this.serviceName,
      data
    }, '*')
  }
}
