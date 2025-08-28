import React, { useState, useEffect, useRef } from 'react'
import { trace, context, propagation, SpanContext, TraceFlags } from '@opentelemetry/api'

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

export const TrafficWidget: React.FC = () => {
  const [traffic, setTraffic] = useState<TrafficData | null>(null)
  const [loading, setLoading] = useState(true)
  const parentSpanContext = useRef<SpanContext | null>(null)
  const tracer = trace.getTracer('traffic-service', '1.0.0')

  // Listen for trace context from parent
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'TRACE_CONTEXT_INIT') {
        console.log('🍯 Traffic service received message:', {
          traceId: event.data.traceId,
          spanId: event.data.spanId
        })
        
        if (event.data.traceId && event.data.spanId) {
          // Create SpanContext directly from traceId and spanId
          parentSpanContext.current = {
            traceId: event.data.traceId,
            spanId: event.data.spanId,
            traceFlags: TraceFlags.SAMPLED,
            isRemote: false  // Try non-remote to see if that helps
          }
          console.log('🍯 Created parent span context:', parentSpanContext.current)
        }
      }
    }
    
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🚦 Traffic widget loading data...')
      
      // First create a simple test span without parent context
      const testSpan = tracer.startSpan('traffic.test_span')
      testSpan.setAttributes({
        'service.name': 'traffic-service',
        'test': 'basic_span_creation'
      })
      testSpan.end()
      console.log('🍯 Created and ended test span')

      // Create spans with explicit parent context
      let loadSpan
      if (parentSpanContext.current) {
        console.log('🍯 Creating span with parent trace ID:', parentSpanContext.current.traceId)
        // Use the startSpan options to set parent directly
        loadSpan = tracer.startSpan('traffic.load_data', {
          parent: parentSpanContext.current
        })
        console.log('🍯 Creating traffic.load_data span with parent context')
      } else {
        loadSpan = tracer.startSpan('traffic.load_data')
        console.log('🍯 Creating traffic.load_data span without parent')
      }
      console.log('🍯 Created traffic.load_data span')
      
      loadSpan.setAttributes({
        'service.name': 'traffic-service',  // Explicitly set service name
        'service.version': '1.0.0',
        'traffic.routes_count': mockTrafficData.routes.length,
        'traffic.overall_status': mockTrafficData.overallStatus,
        'traffic.incidents': mockTrafficData.incidents,
        'traffic.avg_speed': mockTrafficData.averageSpeed
      })
      
      setTraffic(mockTrafficData)
      setLoading(false)
      
      loadSpan.end()
      console.log('🍯 Ended traffic.load_data span')
      
      // Create another span for the widget loaded event
      let widgetLoadedSpan
      if (parentSpanContext.current) {
        widgetLoadedSpan = tracer.startSpan('traffic.widget_loaded', {
          parent: parentSpanContext.current
        })
        console.log('🍯 Creating traffic.widget_loaded span with parent context')
      } else {
        widgetLoadedSpan = tracer.startSpan('traffic.widget_loaded')
        console.log('🍯 Creating traffic.widget_loaded span without parent')
      }
      console.log('🍯 Created traffic.widget_loaded span')
      
      widgetLoadedSpan.setAttributes({
        'service.name': 'traffic-service',  // Explicitly set service name
        'service.version': '1.0.0',
        'widget.type': 'traffic',
        'widget.status': 'loaded'
      })
      
      // Notify parent that widget has loaded
      window.parent.postMessage({
        type: 'WIDGET_LOADED',
        service: 'traffic-service',
        data: {
          routes_count: mockTrafficData.routes.length,
          overall_status: mockTrafficData.overallStatus,
          incidents: mockTrafficData.incidents,
          avg_speed: mockTrafficData.averageSpeed
        }
      }, '*')
      
      widgetLoadedSpan.end()
      console.log('🍯 Ended traffic.widget_loaded span')
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])

  if (loading) return <div style={{padding: '2rem', textAlign: 'center'}}>🚦 Loading...</div>

  // const getStatusColor = (status: string) => ({
  //   green: '#00b894',
  //   yellow: '#fdcb6e', 
  //   red: '#e17055'
  // }[status] || '#74b9ff')

  const getStatusIcon = (status: string) => ({
    green: '🟢',
    yellow: '🟡',
    red: '🔴'
  }[status] || '🟡')

  return (
    <div style={{padding: '1.5rem', background: 'linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%)', color: 'white', borderRadius: '12px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
        <h3 style={{margin: 0, fontSize: '1.25rem'}}>🚦 Traffic</h3>
        <span style={{fontSize: '0.9rem', opacity: 0.9}}>Live Updates</span>
      </div>
      
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px'}}>
        <div style={{textAlign: 'center'}}>
          <div style={{fontSize: '0.8rem', opacity: 0.8}}>Avg Speed</div>
          <div style={{fontSize: '1.4rem', fontWeight: 'bold'}}>{traffic?.averageSpeed} km/h</div>
        </div>
        <div style={{textAlign: 'center'}}>
          <div style={{fontSize: '0.8rem', opacity: 0.8}}>Status</div>
          <div style={{fontSize: '1.1rem', textTransform: 'capitalize'}}>{traffic?.overallStatus}</div>
        </div>
        <div style={{textAlign: 'center'}}>
          <div style={{fontSize: '0.8rem', opacity: 0.8}}>Incidents</div>
          <div style={{fontSize: '1.4rem', fontWeight: 'bold'}}>{traffic?.incidents}</div>
        </div>
      </div>

      <div>
        <h4 style={{margin: '0 0 1rem 0', fontSize: '1rem', opacity: 0.9}}>Major Routes</h4>
        <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
          {traffic?.routes.map((route, index) => (
            <div key={index} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', borderRadius: '6px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                <span style={{fontSize: '1.2rem'}}>{getStatusIcon(route.status)}</span>
                <div>
                  <div style={{fontWeight: '500'}}>{route.name}</div>
                  <div style={{fontSize: '0.8rem', opacity: 0.7}}>{route.distance}</div>
                </div>
              </div>
              <div style={{textAlign: 'right'}}>
                <div style={{fontSize: '0.9rem', fontWeight: '500'}}>{route.travelTime} min</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TrafficWidget