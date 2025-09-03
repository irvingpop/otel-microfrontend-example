import React from 'react'
import ReactDOM from 'react-dom/client'
import TrafficWidget from './TrafficWidget'
import { initializeTelemetry } from '../../shared/telemetry-config'

console.log('🚦 Traffic service starting...')

// Initialize telemetry (will be skipped if in iframe)
initializeTelemetry({
  serviceName: 'traffic-service',
  debug: true
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <TrafficWidget />
    </div>
  </React.StrictMode>
)
