import React from 'react'
import ReactDOM from 'react-dom/client'
import TrafficWidget from './TrafficWidget'
import { HoneycombWebSDK } from '@honeycombio/opentelemetry-web'
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web'

console.log('🚦 Traffic service starting...')

// Initialize telemetry directly
const sdk = new HoneycombWebSDK({
  apiKey: 'demo-key',
  serviceName: 'traffic-service',
  instrumentations: [getWebAutoInstrumentations()],
  debug: true
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