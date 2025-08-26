import React, { useState, useEffect, Suspense } from 'react'
import { trackMicrofrontendLoad, trackMicrofrontendError } from '../lib/telemetry'

interface ModuleFederationWrapperProps {
  name: string
  scope: string
  module: string
  fallback?: React.ReactNode
}

const moduleCache = new Map<string, React.ComponentType>()

export const ModuleFederationWrapper: React.FC<ModuleFederationWrapperProps> = ({
  name,
  scope,
  module,
  fallback = <div className="loading">Loading {name}...</div>
}) => {
  const [Component, setComponent] = useState<React.ComponentType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadComponent = async () => {
      const startTime = performance.now()
      const cacheKey = `${scope}/${module}`

      try {
        // Check cache first
        if (moduleCache.has(cacheKey)) {
          const CachedComponent = moduleCache.get(cacheKey)!
          setComponent(() => CachedComponent)
          setIsLoading(false)
          return
        }

        // Load remote component
        const container = (window as any)[scope]
        if (!container) {
          throw new Error(`Container ${scope} not found. Make sure the remote is running and accessible.`)
        }

        await container.init((window as any).__webpack_share_scopes__.default)
        const factory = await container.get(module)
        const RemoteComponent = factory()

        // Cache the component
        moduleCache.set(cacheKey, RemoteComponent.default || RemoteComponent)
        
        const loadTime = performance.now() - startTime
        trackMicrofrontendLoad(name, loadTime)
        
        setComponent(() => RemoteComponent.default || RemoteComponent)
        setIsLoading(false)
      } catch (err) {
        const error = err as Error
        trackMicrofrontendError(name, error)
        setError(`Failed to load ${name}: ${error.message}`)
        setIsLoading(false)
      }
    }

    loadComponent()
  }, [name, scope, module])

  if (isLoading) {
    return <div className="loading-widget">{fallback}</div>
  }

  if (error || !Component) {
    return (
      <div className="error-boundary">
        <h3>❌ {name} Unavailable</h3>
        <p>{error || `Failed to load component from ${scope}/${module}`}</p>
        <small>Make sure the microfrontend service is running</small>
      </div>
    )
  }

  return (
    <div className="microfrontend-container">
      <Suspense fallback={fallback}>
        <Component />
      </Suspense>
    </div>
  )
}