import React from 'react'

export const EventsWidget: React.FC = () => {
  return (
    <div style={{padding: '1.5rem', background: 'linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%)', color: 'white', borderRadius: '12px'}}>
      <h3>📅 City Events</h3>
      <p>No events currently scheduled.</p>
    </div>
  )
}

export default EventsWidget