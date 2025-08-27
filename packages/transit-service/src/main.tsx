import React from 'react'
import ReactDOM from 'react-dom/client'
import TransitWidget from './TransitWidget'
import { initializeTelemetry } from '../../shared/telemetry-config'

// Initialize telemetry for this service
initializeTelemetry({
  serviceName: 'transit-service',
  debug: true
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <TransitWidget />
    </div>
  </React.StrictMode>
)