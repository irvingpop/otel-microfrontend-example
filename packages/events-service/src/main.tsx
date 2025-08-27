import React from 'react'
import ReactDOM from 'react-dom/client'
import EventsWidget from './EventsWidget'
import { initializeTelemetry } from '../../shared/telemetry-config'

// Initialize telemetry for this service
initializeTelemetry({
  serviceName: 'events-service',
  debug: true
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <EventsWidget />
  </React.StrictMode>
)