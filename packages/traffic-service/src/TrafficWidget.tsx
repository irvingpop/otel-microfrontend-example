import React, { useState, useEffect } from 'react'
import { MicrofrontendTelemetry } from '../../shared/microfrontend-telemetry'

interface TrafficData {
  overallStatus: 'good' | 'moderate' | 'heavy'
  averageSpeed: number
  incidents: number
  routes: Array<{
    name: string
    status: 'green' | 'yellow' | 'red'
    travelTime: number
    distance: string
  }>
}

const mockTrafficData: TrafficData = {
  overallStatus: 'moderate',
  averageSpeed: 45,
  incidents: 2,
  routes: [
    { name: "Main St", status: 'green', travelTime: 12, distance: "8.2 km" },
    { name: "Highway 401", status: 'yellow', travelTime: 28, distance: "15.4 km" },
    { name: "Downtown Core", status: 'red', travelTime: 35, distance: "6.8 km" },
    { name: "Riverside Dr", status: 'green', travelTime: 18, distance: "11.2 km" }
  ]
}

// Initialize telemetry for this microfrontend
const telemetry = new MicrofrontendTelemetry('traffic-service')

export const TrafficWidget: React.FC = () => {
  const [traffic, setTraffic] = useState<TrafficData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🚦 Traffic widget loading data...')

      // Load traffic data with telemetry
      telemetry.withSpan('traffic.load_data', (span) => {
        span.setAttributes({
          'traffic.routes_count': mockTrafficData.routes.length,
          'traffic.overall_status': mockTrafficData.overallStatus,
          'traffic.incidents': mockTrafficData.incidents,
          'traffic.avg_speed': mockTrafficData.averageSpeed
        })

        setTraffic(mockTrafficData)
        setLoading(false)
      })

      // Notify parent that widget has loaded
      telemetry.notifyWidgetLoaded('traffic', {
        routes_count: mockTrafficData.routes.length,
        overall_status: mockTrafficData.overallStatus,
        incidents: mockTrafficData.incidents,
        avg_speed: mockTrafficData.averageSpeed
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>🚦 Loading...</div>

  // const getStatusColor = (status: string) => ({
  //   green: '#00b894',
  //   yellow: '#fdcb6e',
  //   red: '#e17055'
  // }[status] || '#74b9ff')

  const getStatusIcon = (status: string) => ({
    green: '🟢',
    yellow: '🟡',
    red: '🔴'
  }[status] || '⚪')

  // const getOverallStatusInfo = (status: string) => ({
  //   good: { color: '#00b894', text: 'Good Traffic Flow' },
  //   moderate: { color: '#fdcb6e', text: 'Moderate Traffic' },
  //   heavy: { color: '#e17055', text: 'Heavy Traffic' }
  // }[status] || { color: '#74b9ff', text: 'Unknown' })

  return (
    <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #00cec9 0%, #55a3ff 100%)', color: 'white', borderRadius: '12px' }}>
      <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>🚦 Traffic Conditions</h3>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Overall Status</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '600', textTransform: 'capitalize' }}>
              {traffic?.overallStatus || 'Unknown'} Traffic
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Avg Speed</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '300' }}>{traffic?.averageSpeed} km/h</div>
          </div>
        </div>

        {traffic?.incidents && traffic.incidents > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem' }}>
            ⚠️ {traffic.incidents} active incident{traffic.incidents > 1 ? 's' : ''} reported
          </div>
        )}
      </div>

      <div>
        <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', opacity: 0.9 }}>Route Conditions</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {traffic?.routes.map((route, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>{getStatusIcon(route.status)}</span>
                <div>
                  <div style={{ fontWeight: '600' }}>{route.name}</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{route.distance}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{route.travelTime} min</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TrafficWidget
