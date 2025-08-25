import React from 'react'
import ReactDOM from 'react-dom/client'
import TrafficWidget from './TrafficWidget'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <TrafficWidget />
    </div>
  </React.StrictMode>
)