# OpenTelemetry Tracing Implementation Guide

This document explains how OpenTelemetry tracing is implemented in the Smart City Dashboard microfrontend application, achieving a single unified trace per user session across multiple iframes.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Single Trace Pattern](#single-trace-pattern)
3. [Core Components](#core-components)
4. [Session Management](#session-management)
5. [Cross-Iframe Trace Propagation](#cross-iframe-trace-propagation)
6. [Widget Lifecycle Tracking](#widget-lifecycle-tracking)
7. [Auto-Instrumentation Configuration](#auto-instrumentation-configuration)
8. [Known Limitations](#known-limitations)
9. [Testing and Verification](#testing-and-verification)
10. [Best Practices](#best-practices)

## Architecture Overview

The application consists of:
- **UI Shell** (`ui-service-shell`): The main dashboard that hosts microfrontends
- **Microfrontends**: 6 services (weather, traffic, transit, energy, events, notifications) loaded in iframes
- **Shared Libraries**: Common telemetry configuration and utilities

### Key Design Decisions

1. **Single SDK Instance**: Only the shell initializes the OpenTelemetry SDK
2. **Trace Context Propagation**: Parent trace context is passed to iframes via `postMessage`
3. **Unified Trace ID**: All spans are forced into a single trace using `SingleTraceSpanProcessor`
4. **Automatic Span Management**: Spans are auto-closed after timeout or page unload

## Single Trace Pattern

The application ensures all telemetry data belongs to a single trace per user session:

```typescript
// packages/shared/single-trace-processor.ts
export class SingleTraceSpanProcessor implements SpanProcessor {
  private mainTraceId: string | null = null
  private rootSpan: Span | null = null

  onStart(span: Span, _parentContext: Context): void {
    const spanContext = span.spanContext()

    // Capture the first span's trace ID as the main trace
    if (!this.mainTraceId) {
      this.mainTraceId = spanContext.traceId

      // Keep reference to documentLoad as root span
      const spanName = (span as any).name || ''
      if (spanName === 'documentLoad' || spanName === 'pageload') {
        this.rootSpan = span
      }
    }

    // Fix orphan spans by assigning them to the main trace
    if (spanContext.traceId !== this.mainTraceId) {
      const newSpanContext: SpanContext = {
        traceId: this.mainTraceId,
        spanId: spanContext.spanId,
        traceFlags: TraceFlags.SAMPLED
      }

      const spanAny = span as any
      if (spanAny._spanContext) {
        spanAny._spanContext = newSpanContext
      }

      // Set root span as parent for orphans
      if (this.rootSpan && spanAny._parentId === undefined) {
        const rootSpanContext = this.rootSpan.spanContext()
        spanAny._parentId = rootSpanContext.spanId
        spanAny._parentSpanId = rootSpanContext.spanId
      }
    }
  }
}
```

## Core Components

### 1. Telemetry Configuration

```typescript
// packages/shared/telemetry-config.ts
export const initializeTelemetry = (config: TelemetryConfig) => {
  // Only initialize in the shell, not in microfrontends
  if (isInMicrofrontend()) {
    console.log(`🍯 Skipping telemetry initialization for ${config.serviceName}`)
    return
  }

  const sdk = new HoneycombWebSDK({
    apiKey: config.apiKey,
    serviceName: config.serviceName,
    instrumentations: [getWebAutoInstrumentations({
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
    debug: config.debug
  })

  sdk.start()
}
```

### 2. Session Span Management

```typescript
// packages/ui-service-shell/src/lib/telemetry.ts
let sessionTrace: any = null
let sessionEnded = false
let sessionTimeoutId: any = null
const SESSION_TIMEOUT_MS = 10000 // 10 seconds

export const getOrCreateSessionTrace = () => {
  if (!sessionTrace || sessionEnded) {
    sessionEnded = false

    // Create session span as child of current context
    sessionTrace = tracer.startSpan('dashboard.session', {
      attributes: {
        'session.start_time': Date.now(),
        'session.type': 'dashboard',
        'service.name': 'ui-service-shell'
      }
    })

    // Auto-close after timeout
    sessionTimeoutId = setTimeout(() => {
      if (sessionTrace && !sessionEnded) {
        try {
          sessionTrace.setAttribute('session.auto_closed', true)
          sessionTrace.setAttribute('session.close_reason', 'timeout')
          sessionTrace.end()
        } catch (e) {
          console.log('🍯 Session span already ended')
        }
        sessionEnded = true
        sessionTrace = null
      }
    }, SESSION_TIMEOUT_MS)

    // Clean up on page unload
    const cleanup = () => {
      if (sessionTimeoutId) clearTimeout(sessionTimeoutId)
      if (sessionTrace && !sessionEnded) {
        try {
          sessionTrace.setAttribute('session.close_reason', 'page_unload')
          sessionTrace.end()
        } catch (e) {
          console.log('🍯 Session span already ended')
        }
        sessionEnded = true
        sessionTrace = null
      }
    }

    window.addEventListener('beforeunload', cleanup)
    window.addEventListener('unload', cleanup)
    window.addEventListener('pagehide', cleanup)
  }
  return sessionTrace
}
```

## Session Management

The application creates a `dashboard.session` span that serves as the parent for all widget activities:

```typescript
// In Dashboard component
useEffect(() => {
  telemetryReady.then(() => {
    // Create session trace after telemetry is ready
    getOrCreateSessionTrace()
  })
}, [])
```

## Cross-Iframe Trace Propagation

### Shell Side (Sending Context)

```typescript
// SimpleMicrofrontendWrapper.tsx
const sendTraceContext = () => {
  const sessionTrace = getOrCreateSessionTrace()
  const traceHeaders = getTraceContext()

  iframeRef.current?.contentWindow?.postMessage({
    type: 'TRACE_CONTEXT',
    payload: {
      traceHeaders,
      traceId: sessionTrace.spanContext().traceId,
      spanId: sessionTrace.spanContext().spanId
    }
  }, '*')
}
```

### Microfrontend Side (Receiving Context)

```typescript
// packages/shared/microfrontend-telemetry.ts
export class MicrofrontendTelemetry {
  private parentContext: Context | null = null

  private setupTraceContextListener() {
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'TRACE_CONTEXT') {
        const { traceHeaders } = event.data.payload

        // Extract parent context from headers
        this.parentContext = propagation.extract(
          context.active(),
          traceHeaders
        )

        console.log(`🍯 ${this.serviceName} extracted parent context`)
      }
    })
  }

  startSpan(name: string, attributes?: Record<string, any>) {
    const activeContext = this.parentContext || context.active()

    return context.with(activeContext, () => {
      const span = this.tracer.startSpan(name)
      span.setAttributes({
        'service.name': this.serviceName,
        ...attributes
      })
      return span
    })
  }
}
```

## Widget Lifecycle Tracking

### Activation/Deactivation Tracking

```typescript
// Prevent duplicate events
const widgetStates = new Map<string, boolean>()

export const trackWidgetActivation = (widgetName: string) => {
  if (widgetStates.get(widgetName)) {
    return // Already activated
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
}
```

### Widget Data Loading

```typescript
// In microfrontend widget
const telemetry = new MicrofrontendTelemetry('weather-service')

useEffect(() => {
  telemetry.withSpan('weather.load_data', async (span) => {
    span.setAttribute('weather.location', 'San Francisco')

    try {
      const data = await fetchWeatherData()
      span.setAttribute('weather.temperature', data.temp)
      span.setAttribute('weather.conditions', data.conditions)
    } catch (error) {
      span.recordException(error)
      span.setStatus({ code: SpanStatusCode.ERROR })
    }
  })

  telemetry.notifyWidgetLoaded()
}, [])
```

## Auto-Instrumentation Configuration

The application uses OpenTelemetry's auto-instrumentations with specific configurations:

```typescript
getWebAutoInstrumentations({
  // Enable cross-origin trace propagation
  '@opentelemetry/instrumentation-xml-http-request': {
    propagateTraceHeaderCorsUrls: /.*/,
    clearTimingResources: true
  },
  '@opentelemetry/instrumentation-fetch': {
    propagateTraceHeaderCorsUrls: /.*/,
    clearTimingResources: true
  },
  // Capture page load metrics
  '@opentelemetry/instrumentation-document-load': {
    enabled: true
  },
  // Track user interactions (clicks, etc.)
  '@opentelemetry/instrumentation-user-interaction': {
    enabled: true
  }
})
```

## Known Limitations

### 1. DocumentLoad Phantom Parent

The `documentLoad` span created by auto-instrumentation references a non-existent parent span. This is a limitation of the OpenTelemetry web instrumentation and doesn't affect functionality.

### 2. Auto-Close Mechanism

Important spans are excluded from auto-closing:
```typescript
const importantSpans = [
  'documentLoad',
  'pageload',
  'documentFetch',
  'resourceFetch',
  'dashboard.session'
]
```

### 3. Double-End Protection

All span ending operations are wrapped in try-catch blocks to handle cases where spans might be ended multiple times:

```typescript
try {
  span.end()
} catch (e) {
  console.log('Span already ended')
}
```

## Testing and Verification

### Manual Testing with Playwright

```javascript
const { chromium } = require('playwright');

async function verifyTracing() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Monitor console for trace IDs
  page.on('console', msg => {
    if (msg.text().includes('🍯')) {
      console.log(msg.text());
    }
  });

  await page.goto('http://localhost:8080');
  await page.click('text=Traffic Monitor');

  // Verify single trace ID is used
  await page.waitForTimeout(3000);
  await browser.close();
}
```

### Honeycomb Verification

Check for:
1. Single trace ID per session
2. Proper parent-child relationships
3. No orphan spans (except known documentLoad issue)
4. Session span with all widget spans as children

## Best Practices

1. **Always use the telemetry helpers** instead of creating spans directly
2. **Check for duplicate events** before emitting (use Maps/Sets)
3. **Include error handling** in span operations
4. **Add meaningful attributes** to spans for debugging
5. **Use the withSpan helper** for automatic span lifecycle management
6. **Test with real browser sessions** not just unit tests

### Example: Proper Span Creation in Microfrontend

```typescript
// ❌ Don't do this
const span = tracer.startSpan('my-operation')
// ... work ...
span.end()

// ✅ Do this instead
telemetry.withSpan('my-operation', async (span) => {
  span.setAttribute('operation.type', 'data-fetch')
  // Work happens here
  // Span automatically ends, even if an error occurs
})
```

### Example: Shell-Side Widget Tracking

```typescript
// ❌ Don't emit duplicate events
const handleActivate = (widget) => {
  trackWidgetActivation(widget) // Could be called multiple times
}

// ✅ The helper already prevents duplicates
const handleActivate = (widget) => {
  trackWidgetActivation(widget) // Safe to call multiple times
}
```

## Debugging Tips

1. **Enable debug mode**: Set `VITE_DEBUG_TELEMETRY=true`
2. **Check console logs**: Look for 🍯 prefixed messages
3. **Verify trace context**: Check that `TRACE_CONTEXT` messages are sent/received
4. **Monitor span lifecycle**: Use the processor's logging to track span creation/ending
5. **Use Honeycomb queries**: Query by trace ID to see all spans in a session

This implementation ensures robust, unified tracing across a complex microfrontend architecture while handling edge cases and providing excellent observability.
