import { SpanProcessor, Span, ReadableSpan } from '@opentelemetry/sdk-trace-base'
import { Context, SpanContext, TraceFlags } from '@opentelemetry/api'

/**
 * Custom SpanProcessor that ensures all spans belong to a single trace
 * This prevents auto-instrumentations from creating separate traces
 */
export class SingleTraceSpanProcessor implements SpanProcessor {
  private mainTraceId: string | null = null
  private rootSpan: Span | null = null
  private openSpans = new Map<string, { span: Span, name: string, startTime: number }>()
  private AUTO_END_TIMEOUT_MS = 10000 // 10 seconds

  constructor() {
    // Set up cleanup when page unloads
    const cleanup = () => {
      if (this.openSpans.size > 0) {
        console.log(`🍯 Page unloading, closing ${this.openSpans.size} open spans`)
        this.openSpans.forEach(({ span, name }) => {
          console.log(`🍯 Force closing span on unload: ${name}`)
          try {
            span.setAttribute('auto_closed', true)
            span.setAttribute('close_reason', 'page_unload')
            span.end()
          } catch (e) {
            console.log(`🍯 Span already ended: ${name}`)
          }
        })
        this.openSpans.clear()
      }
    }

    window.addEventListener('beforeunload', cleanup)
    window.addEventListener('unload', cleanup)
    window.addEventListener('pagehide', cleanup)
  }

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

        // Check if the span has parent information
        const spanAny = span as any
        console.log('🍯 Root span details:', {
          traceId: spanContext.traceId,
          spanId: spanContext.spanId,
          name: spanName,
          parentSpanContext: spanAny.parentSpanContext,
          _parentId: spanAny._parentId,
          _parentSpanId: spanAny._parentSpanId,
          parentSpanId: spanAny.parentSpanId
        })

        // Clear the parent span context so this becomes a true root span
        if (spanAny.parentSpanContext) {
          console.log('🍯 Clearing parentSpanContext from root span')
          spanAny.parentSpanContext = undefined
        }

        // Try to access the internal span ID that's sent to Honeycomb
        if (spanAny._spanContext && spanAny._spanContext.parentSpanId) {
          console.log('🍯 Clearing parentSpanId from _spanContext')
          delete spanAny._spanContext.parentSpanId
        }
      }
      // Don't return here - we still need to process the span below
    }

    // Get span name early for logging
    const spanName = (span as any).name || 'unknown'

    // If this span has a different trace ID, we need to fix it
    if (spanContext.traceId !== this.mainTraceId) {
      console.log('🍯 SingleTraceProcessor: Fixing orphan span:', {
        name: spanName,
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

      // If we have a root span, try to set it as parent (but not for the root span itself)
      if (this.rootSpan && spanAny._parentId === undefined && spanName !== 'documentLoad' && spanName !== 'pageload') {
        const rootSpanContext = this.rootSpan.spanContext()
        spanAny._parentId = rootSpanContext.spanId
        spanAny._parentSpanId = rootSpanContext.spanId
        console.log(`🍯 Setting parent for ${spanName} to root span (${rootSpanContext.spanId})`)
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

    // Track open spans
    const spanId = spanContext.spanId
    this.openSpans.set(spanId, {
      span,
      name: spanName,
      startTime: Date.now()
    })

    // Set up auto-close timeout for this span (except for important spans)
    const importantSpans = ['documentLoad', 'pageload', 'documentFetch', 'resourceFetch', 'dashboard.session']
    const shouldAutoClose = !importantSpans.includes(spanName)

    if (shouldAutoClose) {
      setTimeout(() => {
        if (this.openSpans.has(spanId)) {
          console.log(`🍯 Auto-closing span after timeout: ${spanName} (${spanId})`)
          try {
            span.setAttribute('auto_closed', true)
            span.setAttribute('close_reason', 'processor_timeout')
            span.end()
          } catch (e) {
            console.log(`🍯 Span already ended: ${spanName}`)
          }
          this.openSpans.delete(spanId)
        }
      }, this.AUTO_END_TIMEOUT_MS)
    }

    // Log open spans for debugging
    if (this.openSpans.size > 5) {
      console.log('🍯 Warning: Many open spans:', Array.from(this.openSpans.values()).map(s => s.name))
    }
  }

  onEnd(span: ReadableSpan): void {
    // Remove from open spans
    const spanId = span.spanContext().spanId
    if (this.openSpans.has(spanId)) {
      this.openSpans.delete(spanId)
    }

    // Log details about the documentLoad span when it ends
    if (span.name === 'documentLoad') {
      const spanAny = span as any
      console.log('🍯 DocumentLoad span ending, details:', {
        name: span.name,
        traceId: span.spanContext().traceId,
        spanId: span.spanContext().spanId,
        parentSpanId: (span as any).parentSpanId,
        allKeys: Object.keys(spanAny),
        parentSpanIdValue: spanAny.parentSpanId,
        _parentSpanId: spanAny._parentSpanId
      })
    }
  }

  shutdown(): Promise<void> {
    // Close any remaining open spans
    if (this.openSpans.size > 0) {
      console.log(`🍯 Shutdown: closing ${this.openSpans.size} remaining spans`)
      this.openSpans.forEach(({ span, name }) => {
        console.log(`🍯 Force closing span on shutdown: ${name}`)
        try {
          span.setAttribute('auto_closed', true)
          span.setAttribute('close_reason', 'processor_shutdown')
          span.end()
        } catch (e) {
          console.log(`🍯 Span already ended: ${name}`)
        }
      })
      this.openSpans.clear()
    }
    return Promise.resolve()
  }

  forceFlush(): Promise<void> {
    // Close any spans that have been open too long
    const now = Date.now()
    this.openSpans.forEach(({ span, name, startTime }, spanId) => {
      const duration = now - startTime
      if (duration > this.AUTO_END_TIMEOUT_MS) {
        console.log(`🍯 Force flushing overdue span: ${name} (open for ${duration}ms)`)
        try {
          span.setAttribute('auto_closed', true)
          span.setAttribute('close_reason', 'force_flush')
          span.setAttribute('duration_ms', duration)
          span.end()
        } catch (e) {
          console.log(`🍯 Span already ended: ${name}`)
        }
        this.openSpans.delete(spanId)
      }
    })
    return Promise.resolve()
  }
}
