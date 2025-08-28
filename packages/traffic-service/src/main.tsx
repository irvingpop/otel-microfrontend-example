import React from 'react'
import ReactDOM from 'react-dom/client'
import TrafficWidget from './TrafficWidget'
import { HoneycombWebSDK } from '@honeycombio/opentelemetry-web'
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web'

console.log('🚦 Traffic service starting...')

// Initialize telemetry using centralized environment variables
const apiKey = import.meta.env.VITE_HONEYCOMB_API_KEY || 'demo-key'
const debug = import.meta.env.VITE_DEBUG_TELEMETRY === 'true'

const sdk = new HoneycombWebSDK({
  apiKey,
  serviceName: 'traffic-service',
  instrumentations: [getWebAutoInstrumentations()],
  debug
})

sdk.start()
console.log('🍯 Honeycomb SDK initialized for traffic-service')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <TrafficWidget />
    </div>
  </React.StrictMode>
)