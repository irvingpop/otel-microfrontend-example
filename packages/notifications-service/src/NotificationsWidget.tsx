import React, { useEffect } from 'react'

export const NotificationsWidget: React.FC = () => {
  useEffect(() => {
    // Notify parent that widget has loaded
    window.parent.postMessage({
      type: 'WIDGET_LOADED',
      service: 'notifications-service',
      data: {
        notifications_count: 0,
        status: 'operational',
        type: 'system_status',
        has_alerts: false
      }
    }, '*')
  }, [])

  return (
    <div style={{padding: '1.5rem', background: 'linear-gradient(135deg, #e84393 0%, #fd79a8 100%)', color: 'white', borderRadius: '12px'}}>
      <h3>🔔 Notifications</h3>
      <p>All systems operational.</p>
    </div>
  )
}

export default NotificationsWidget