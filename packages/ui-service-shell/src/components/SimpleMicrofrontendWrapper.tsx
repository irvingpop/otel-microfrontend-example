import React, { useState, useEffect } from 'react'
import { microfrontends, checkServiceHealth } from '../lib/simpleMicrofrontendLoader'
import { trackMicrofrontendLoad, trackMicrofrontendError } from '../lib/telemetry'

interface SimpleMicrofrontendWrapperProps {
  name: string
  fallback?: React.ReactNode
}

export const SimpleMicrofrontendWrapper: React.FC<SimpleMicrofrontendWrapperProps> = ({
  name,
  fallback = <div className="loading">Loading {name}...</div>
}) => {
  const [isHealthy, setIsHealthy] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const config = microfrontends[name]

  useEffect(() => {
    if (!config) {
      setError(`Microfrontend ${name} not configured`)
      setIsLoading(false)
      return
    }

    const startTime = performance.now()
    
    checkServiceHealth(config.url)
      .then(healthy => {
        setIsHealthy(healthy)
        setIsLoading(false)
        
        const loadTime = performance.now() - startTime
        if (healthy) {
          trackMicrofrontendLoad(config.name, loadTime)
        } else {
          trackMicrofrontendError(config.name, new Error(`Service ${name} is not healthy`))
          setError(`Service ${name} is not running on ${config.url}`)
        }
      })
      .catch(err => {
        const loadTime = performance.now() - startTime
        trackMicrofrontendError(config.name, err)
        setError(`Failed to check ${name}: ${err.message}`)
        setIsLoading(false)
      })
  }, [name, config])

  if (isLoading) {
    return <div className="loading-widget">{fallback}</div>
  }

  if (error || !isHealthy) {
    return (
      <div className="error-boundary">
        <h3>❌ {config?.name || name} Unavailable</h3>
        <p>{error || `Service not running on port ${config?.port}`}</p>
        <small>Start the service with: npm run dev --workspace={config?.name}</small>
      </div>
    )
  }

  return (
    <div className="microfrontend-container">
      <iframe
        src={config.url}
        width="100%"
        height="400"
        style={{
          border: 'none',
          borderRadius: '8px',
          backgroundColor: 'white'
        }}
        title={config.name}
        onLoad={() => {
          console.log(`✅ Loaded microfrontend: ${config.name}`)
        }}
        onError={() => {
          trackMicrofrontendError(config.name, new Error('Iframe failed to load'))
        }}
      />
    </div>
  )
}