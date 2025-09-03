import React, { useEffect } from 'react'
import { MicrofrontendTelemetry } from '../../shared/microfrontend-telemetry'

export const EventsWidget: React.FC = () => {
  const telemetry = new MicrofrontendTelemetry('events-service')
  useEffect(() => {
    // Load events data with telemetry
    telemetry.withSpan('events.load_data', (span) => {
      span.setAttributes({
        'events.count': 0,
        'events.status': 'no_events',
        'events.has_data': false
      })
    })

    // Notify parent that widget has loaded
    telemetry.notifyWidgetLoaded('events', {
      events_count: 0,
      status: 'no_events',
      has_data: false
    })
  }, [])

  return (
    <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%)', color: 'white', borderRadius: '12px' }}>
      <h3>📅 City Events</h3>
      <p>No events currently scheduled.</p>
    </div>
  )
}

export default EventsWidget
