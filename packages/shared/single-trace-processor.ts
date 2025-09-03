import { SpanProcessor, Span, ReadableSpan } from '@opentelemetry/sdk-trace-base'
import { Context, SpanContext, TraceFlags } from '@opentelemetry/api'

/**
 * Custom SpanProcessor that ensures all spans belong to a single trace
 * This prevents auto-instrumentations from creating separate traces
 */
export class SingleTraceSpanProcessor implements SpanProcessor {
  private mainTraceId: string | null = null
  private rootSpan: Span | null = null

  onStart(span: Span, _parentContext: Context): void {
    const spanContext = span.spanContext()

    // If this is the first span (likely documentLoad), capture it as the main trace
    if (!this.mainTraceId) {
      this.mainTraceId = spanContext.traceId
      console.log('🍯 SingleTraceProcessor: Captured main trace ID:', this.mainTraceId)

      // If this looks like the documentLoad span, keep a reference
      const spanName = (span as any).name || ''
      if (spanName === 'documentLoad' || spanName === 'pageload') {
        this.rootSpan = span
        console.log('🍯 SingleTraceProcessor: Found root span:', spanName)
      }
      return
    }

    // If this span has a different trace ID, we need to fix it
    if (spanContext.traceId !== this.mainTraceId) {
      console.log('🍯 SingleTraceProcessor: Fixing orphan span:', {
        name: (span as any).name,
        originalTraceId: spanContext.traceId,
        mainTraceId: this.mainTraceId
      })

      // Create a new context with our main trace
      const newSpanContext: SpanContext = {
        traceId: this.mainTraceId,
        spanId: spanContext.spanId,
        traceFlags: TraceFlags.SAMPLED
      }

      // Set the span context to use our main trace
      // This is a bit hacky but necessary to fix orphan spans
      const spanAny = span as any
      if (spanAny._spanContext) {
        spanAny._spanContext = newSpanContext
      }

      // If we have a root span, try to set it as parent
      if (this.rootSpan && spanAny._parentId === undefined) {
        const rootSpanContext = this.rootSpan.spanContext()
        spanAny._parentId = rootSpanContext.spanId
        spanAny._parentSpanId = rootSpanContext.spanId
      }
    }

    // Add attributes to identify the module
    let moduleName = 'smart-city-dashboard'

    // Determine module from iframe context
    if (window.self !== window.top) {
      const pathname = window.location.pathname
      if (pathname.includes('weather')) moduleName = 'weather-service'
      else if (pathname.includes('traffic')) moduleName = 'traffic-service'
      else if (pathname.includes('transit')) moduleName = 'transit-service'
      else if (pathname.includes('energy')) moduleName = 'energy-service'
      else if (pathname.includes('events')) moduleName = 'events-service'
      else if (pathname.includes('notifications')) moduleName = 'notifications-service'
    }

    span.setAttributes({
      'module.name': moduleName,
      'module.is_iframe': window.self !== window.top
    })
  }

  onEnd(_span: ReadableSpan): void {
    // Nothing to do on end
  }

  shutdown(): Promise<void> {
    return Promise.resolve()
  }

  forceFlush(): Promise<void> {
    return Promise.resolve()
  }
}
