import React from 'react'
import ReactDOM from 'react-dom/client'
import WeatherWidget from './WeatherWidget'
import { initializeTelemetry } from '../../shared/telemetry-config'

// Initialize telemetry for this service
initializeTelemetry({
  serviceName: 'weather-service',
  debug: true
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <WeatherWidget />
    </div>
  </React.StrictMode>
)