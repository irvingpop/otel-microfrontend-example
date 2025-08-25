import { createMicrofrontendSpan, trackMicrofrontendLoad, trackMicrofrontendError } from './telemetry'

export interface MicrofrontendConfig {
  name: string
  url: string
  scope: string
  module: string
  port: number
}

export const microfrontends: Record<string, MicrofrontendConfig> = {
  weather: {
    name: 'weather-service',
    url: 'http://localhost:3001',
    scope: 'weatherService',
    module: './WeatherWidget',
    port: 3001
  },
  traffic: {
    name: 'traffic-service',
    url: 'http://localhost:3002',
    scope: 'trafficService', 
    module: './TrafficWidget',
    port: 3002
  },
  transit: {
    name: 'transit-service',
    url: 'http://localhost:3003',
    scope: 'transitService',
    module: './TransitWidget',
    port: 3003
  },
  energy: {
    name: 'energy-service',
    url: 'http://localhost:3004',
    scope: 'energyService',
    module: './EnergyWidget',
    port: 3004
  },
  events: {
    name: 'events-service',
    url: 'http://localhost:3005',
    scope: 'eventsService',
    module: './EventsWidget',
    port: 3005
  },
  notifications: {
    name: 'notifications-service',
    url: 'http://localhost:3006',
    scope: 'notificationsService',
    module: './NotificationsWidget',
    port: 3006
  }
}

// Note: This file demonstrates advanced Module Federation concepts
// For the demo, we use the simplified iframe-based approach

const loadedMicrofrontends = new Map<string, any>()

export const loadMicrofrontend = async (key: string): Promise<any> => {
  const config = microfrontends[key]
  if (!config) {
    throw new Error(`Microfrontend ${key} not found`)
  }

  if (loadedMicrofrontends.has(key)) {
    return loadedMicrofrontends.get(key)
  }

  const span = createMicrofrontendSpan(config.name, 'load')
  const startTime = performance.now()

  try {
    await loadRemoteEntry(config.url)
    
    const container = window[config.scope]
    if (!container) {
      throw new Error(`Container ${config.scope} not found`)
    }

    await container.init(__webpack_share_scopes__.default)
    const factory = await container.get(config.module)
    const Module = factory()
    
    loadedMicrofrontends.set(key, Module)
    
    const loadTime = performance.now() - startTime
    trackMicrofrontendLoad(config.name, loadTime)
    
    span.setAttributes({
      'microfrontend.load_time_ms': loadTime,
      'microfrontend.status': 'success'
    })
    span.end()
    
    return Module
  } catch (error) {
    const loadTime = performance.now() - startTime
    trackMicrofrontendError(config.name, error as Error)
    
    span.setAttributes({
      'microfrontend.load_time_ms': loadTime,
      'microfrontend.status': 'error',
      'microfrontend.error': (error as Error).message
    })
    span.recordException(error as Error)
    span.end()
    
    throw error
  }
}

const loadRemoteEntry = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${url}/remoteEntry.js"]`)
    if (existingScript) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = `${url}/remoteEntry.js`
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load remote entry from ${url}`))
    document.head.appendChild(script)
  })
}