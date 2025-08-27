import React from 'react'
import ReactDOM from 'react-dom/client'
import NotificationsWidget from './NotificationsWidget'
import { initializeTelemetry } from '../../shared/telemetry-config'

// Initialize telemetry for this service
initializeTelemetry({
  serviceName: 'notifications-service',
  debug: true
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NotificationsWidget />
  </React.StrictMode>
)