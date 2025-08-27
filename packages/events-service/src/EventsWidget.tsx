import React, { useEffect } from 'react'

export const EventsWidget: React.FC = () => {
  useEffect(() => {
    // Notify parent that widget has loaded
    window.parent.postMessage({
      type: 'WIDGET_LOADED',
      service: 'events-service',
      data: {
        events_count: 0,
        status: 'no_events',
        has_data: false
      }
    }, '*')
  }, [])

  return (
    <div style={{padding: '1.5rem', background: 'linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%)', color: 'white', borderRadius: '12px'}}>
      <h3>📅 City Events</h3>
      <p>No events currently scheduled.</p>
    </div>
  )
}

export default EventsWidget