import React, { useState } from 'react'
import { SimpleMicrofrontendWrapper } from './SimpleMicrofrontendWrapper'
import { createMicrofrontendSpan } from '../lib/telemetry'
import './Dashboard.css'

interface VisibleWidgets {
  weather: boolean
  traffic: boolean
  transit: boolean
  energy: boolean
  events: boolean
  notifications: boolean
}

export const Dashboard: React.FC = () => {
  const [visibleWidgets, setVisibleWidgets] = useState<VisibleWidgets>({
    weather: true,  // Always visible on load
    traffic: false,
    transit: false,
    energy: false,
    events: false,
    notifications: false
  })

  const getTotalVisibleWidgets = () => {
    return Object.values(visibleWidgets).filter(Boolean).length
  }

  const toggleWidget = (widgetName: keyof VisibleWidgets, isMultiple?: string[]) => {
    const span = createMicrofrontendSpan(widgetName, 'toggle')
    
    setVisibleWidgets(prev => {
      if (isMultiple) {
        // Handle multiple widgets (events + notifications)
        const newState = { ...prev }
        isMultiple.forEach(widget => {
          newState[widget as keyof VisibleWidgets] = !prev[widget as keyof VisibleWidgets]
        })
        span.setAttributes({
          'user.action': 'toggle_multiple',
          'widgets.toggled': isMultiple.join(','),
          'widgets.new_state': isMultiple.map(w => newState[w as keyof VisibleWidgets]).join(',')
        })
        return newState
      } else {
        // Handle single widget
        const newState = {
          ...prev,
          [widgetName]: !prev[widgetName]
        }
        span.setAttributes({
          'user.action': 'toggle_single',
          'widget.new_state': newState[widgetName]
        })
        return newState
      }
    })
    
    span.end()
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🏙️ Smart City Dashboard</h1>
        <p>Real-time city monitoring with OpenTelemetry observability</p>
      </header>

      <div className="dashboard-controls">
        <button 
          className={`control-btn ${visibleWidgets.traffic ? 'active' : ''}`}
          onClick={() => toggleWidget('traffic')}
        >
          🚦 Traffic Monitor
        </button>
        
        <button 
          className={`control-btn ${visibleWidgets.transit ? 'active' : ''}`}
          onClick={() => toggleWidget('transit')}
        >
          🚌 Public Transit
        </button>
        
        <button 
          className={`control-btn ${visibleWidgets.energy ? 'active' : ''}`}
          onClick={() => toggleWidget('energy')}
        >
          ⚡ Energy Grid
        </button>
        
        <button 
          className={`control-btn ${(visibleWidgets.events || visibleWidgets.notifications) ? 'active' : ''}`}
          onClick={() => toggleWidget('events', ['events', 'notifications'])}
        >
          📅 City Updates
        </button>
      </div>
      
      <div className={`dashboard-grid ${getTotalVisibleWidgets() === 1 ? 'single-widget' : ''}`}>
        {/* Weather is always visible */}
        <div className="widget-container">
          <SimpleMicrofrontendWrapper 
            name="weather" 
            fallback={<div className="loading-widget">🌤️ Loading Weather...</div>}
          />
        </div>
        
        {/* Dynamically loaded widgets */}
        {visibleWidgets.traffic && (
          <div className="widget-container fade-in">
            <SimpleMicrofrontendWrapper 
              name="traffic" 
              fallback={<div className="loading-widget">🚦 Loading Traffic...</div>}
            />
          </div>
        )}
        
        {visibleWidgets.transit && (
          <div className="widget-container fade-in">
            <SimpleMicrofrontendWrapper 
              name="transit" 
              fallback={<div className="loading-widget">🚌 Loading Transit...</div>}
            />
          </div>
        )}
        
        {visibleWidgets.energy && (
          <div className="widget-container fade-in">
            <SimpleMicrofrontendWrapper 
              name="energy" 
              fallback={<div className="loading-widget">⚡ Loading Energy...</div>}
            />
          </div>
        )}
        
        {visibleWidgets.events && (
          <div className="widget-container wide fade-in">
            <SimpleMicrofrontendWrapper 
              name="events" 
              fallback={<div className="loading-widget">📅 Loading Events...</div>}
            />
          </div>
        )}
        
        {visibleWidgets.notifications && (
          <div className="widget-container fade-in">
            <SimpleMicrofrontendWrapper 
              name="notifications" 
              fallback={<div className="loading-widget">🔔 Loading Notifications...</div>}
            />
          </div>
        )}
      </div>
    </div>
  )
}