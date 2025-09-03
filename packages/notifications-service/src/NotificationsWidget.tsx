import React, { useEffect } from 'react'
import { MicrofrontendTelemetry } from '../../shared/microfrontend-telemetry'

export const NotificationsWidget: React.FC = () => {
  const telemetry = new MicrofrontendTelemetry('notifications-service')
  useEffect(() => {
    // Load notifications data with telemetry
    telemetry.withSpan('notifications.load_data', (span) => {
      span.setAttributes({
        'notifications.count': 0,
        'notifications.status': 'operational',
        'notifications.type': 'system_status',
        'notifications.has_alerts': false
      })
    })

    // Notify parent that widget has loaded
    telemetry.notifyWidgetLoaded('notifications', {
      notifications_count: 0,
      status: 'operational',
      type: 'system_status',
      has_alerts: false
    })
  }, [])

  return (
    <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #e84393 0%, #fd79a8 100%)', color: 'white', borderRadius: '12px' }}>
      <h3>🔔 Notifications</h3>
      <p>All systems operational.</p>
    </div>
  )
}

export default NotificationsWidget
