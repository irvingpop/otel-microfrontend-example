import React, { Suspense, lazy, ErrorBoundary } from 'react'
import { loadMicrofrontend } from '../lib/microfrontendLoader'
import { createMicrofrontendSpan } from '../lib/telemetry'

interface MicrofrontendWrapperProps {
  name: string
  fallback?: React.ReactNode
}

interface MicrofrontendErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class MicrofrontendErrorBoundary extends React.Component<
  { children: React.ReactNode; name: string },
  MicrofrontendErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; name: string }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): MicrofrontendErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const span = createMicrofrontendSpan(this.props.name, 'render_error')
    span.setAttributes({
      'microfrontend.error': error.message,
      'microfrontend.error_info': JSON.stringify(errorInfo)
    })
    span.recordException(error)
    span.end()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h3>❌ Failed to load {this.props.name}</h3>
          <p>{this.state.error?.message}</p>
        </div>
      )
    }

    return this.props.children
  }
}

const createLazyMicrofrontend = (name: string) => {
  return lazy(async () => {
    const span = createMicrofrontendSpan(name, 'dynamic_import')
    try {
      const module = await loadMicrofrontend(name)
      span.end()
      return { default: module.default || module }
    } catch (error) {
      span.recordException(error as Error)
      span.end()
      throw error
    }
  })
}

export const MicrofrontendWrapper: React.FC<MicrofrontendWrapperProps> = ({
  name,
  fallback = <div className="loading">Loading {name}...</div>
}) => {
  const LazyMicrofrontend = React.useMemo(() => createLazyMicrofrontend(name), [name])

  return (
    <MicrofrontendErrorBoundary name={name}>
      <Suspense fallback={fallback}>
        <LazyMicrofrontend />
      </Suspense>
    </MicrofrontendErrorBoundary>
  )
}