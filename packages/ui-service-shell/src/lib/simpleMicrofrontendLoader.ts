// Simplified microfrontend loader using iframes for demo purposes
// In production, you would use proper Module Federation

export interface MicrofrontendConfig {
  name: string
  url: string
  port: number
}

export const microfrontends: Record<string, MicrofrontendConfig> = {
  weather: {
    name: 'weather-service',
    url: 'http://localhost:8081',
    port: 8081
  },
  traffic: {
    name: 'traffic-service', 
    url: 'http://localhost:8082',
    port: 8082
  },
  transit: {
    name: 'transit-service',
    url: 'http://localhost:8083',
    port: 8083
  },
  energy: {
    name: 'energy-service',
    url: 'http://localhost:8084',
    port: 8084
  },
  events: {
    name: 'events-service',
    url: 'http://localhost:8085',
    port: 8085
  },
  notifications: {
    name: 'notifications-service',
    url: 'http://localhost:8086',
    port: 8086
  }
}

export const checkServiceHealth = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}