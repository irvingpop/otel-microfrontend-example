import React, { useState, useEffect } from 'react'

interface TransitData {
  routes: Array<{
    line: string
    destination: string
    nextArrival: string
    delay: number
    status: 'on-time' | 'delayed' | 'cancelled'
  }>
  alerts: string[]
}

const mockTransitData: TransitData = {
  routes: [
    { line: "Red Line", destination: "Downtown", nextArrival: "3 min", delay: 0, status: 'on-time' },
    { line: "Blue Line", destination: "Airport", nextArrival: "7 min", delay: 2, status: 'delayed' },
    { line: "Green Line", destination: "University", nextArrival: "12 min", delay: 0, status: 'on-time' },
    { line: "Bus 42", destination: "Mall", nextArrival: "5 min", delay: 1, status: 'delayed' }
  ],
  alerts: ["Track maintenance on Yellow Line", "Service disruption on Bus Route 15"]
}

export const TransitWidget: React.FC = () => {
  const [data, setData] = useState<TransitData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(mockTransitData)
      setLoading(false)
      
      // Notify parent that widget has loaded
      window.parent.postMessage({
        type: 'WIDGET_LOADED',
        service: 'transit-service',
        data: {
          routes_count: mockTransitData.routes.length,
          alerts_count: mockTransitData.alerts.length,
          on_time_routes: mockTransitData.routes.filter(r => r.status === 'on-time').length,
          delayed_routes: mockTransitData.routes.filter(r => r.status === 'delayed').length,
          cancelled_routes: mockTransitData.routes.filter(r => r.status === 'cancelled').length
        }
      }, '*')
    }, 700)
    
    return () => clearTimeout(timer)
  }, [])

  if (loading) return <div style={{padding: '2rem', textAlign: 'center'}}>🚌 Loading transit data...</div>

  const getStatusColor = (status: string) => ({
    'on-time': '#00b894',
    'delayed': '#fdcb6e',
    'cancelled': '#e17055'
  }[status] || '#74b9ff')

  const getStatusIcon = (status: string) => ({
    'on-time': '✅',
    'delayed': '⚠️',
    'cancelled': '❌'
  }[status] || '🟡')

  return (
    <div style={{padding: '1.5rem', background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)', color: 'white', borderRadius: '12px'}}>
      <h3 style={{margin: '0 0 1.5rem 0', fontSize: '1.25rem'}}>🚌 Public Transit</h3>
      
      <div style={{marginBottom: '1.5rem'}}>
        <h4 style={{margin: '0 0 1rem 0', fontSize: '1rem', opacity: 0.9}}>Next Arrivals</h4>
        <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
          {data?.routes.map((route, index) => (
            <div key={index} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                <span style={{fontSize: '1.1rem'}}>{getStatusIcon(route.status)}</span>
                <div>
                  <div style={{fontWeight: '600', fontSize: '0.95rem'}}>{route.line}</div>
                  <div style={{fontSize: '0.8rem', opacity: 0.8}}>to {route.destination}</div>
                </div>
              </div>
              <div style={{textAlign: 'right'}}>
                <div style={{fontSize: '1.1rem', fontWeight: '600'}}>{route.nextArrival}</div>
                {route.delay > 0 && (
                  <div style={{fontSize: '0.75rem', opacity: 0.8}}>+{route.delay} min delay</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {data?.alerts && data.alerts.length > 0 && (
        <div>
          <h4 style={{margin: '0 0 0.75rem 0', fontSize: '1rem', opacity: 0.9}}>Service Alerts</h4>
          <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
            {data.alerts.map((alert, index) => (
              <div key={index} style={{padding: '0.5rem', background: 'rgba(255,193,7,0.2)', borderRadius: '6px', fontSize: '0.85rem', borderLeft: '3px solid #ffc107'}}>
                ⚠️ {alert}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TransitWidget