import React, { useState, useEffect } from 'react'
import { SimpleMicrofrontendWrapper } from './SimpleMicrofrontendWrapper'
import { getOrCreateSessionTrace, trackWidgetActivation, trackWidgetDeactivation } from '../lib/telemetry'
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

  // Initialize session trace when dashboard loads
  useEffect(() => {
    getOrCreateSessionTrace()
    // Track initial weather widget as activated
    trackWidgetActivation('weather')
  }, [])

  const getTotalVisibleWidgets = () => {
    return Object.values(visibleWidgets).filter(Boolean).length
  }

  const toggleWidget = (widgetName: keyof VisibleWidgets, isMultiple?: string[]) => {
    setVisibleWidgets(prev => {
      if (isMultiple) {
        // Handle multiple widgets (events + notifications)
        const newState = { ...prev }
        isMultiple.forEach(widget => {
          const isActivating = !prev[widget as keyof VisibleWidgets]
          newState[widget as keyof VisibleWidgets] = isActivating
          
          // Track activation/deactivation
          if (isActivating) {
            trackWidgetActivation(widget)
          } else {
            trackWidgetDeactivation(widget)
          }
        })
        return newState
      } else {
        // Handle single widget
        const isActivating = !prev[widgetName]
        const newState = {
          ...prev,
          [widgetName]: isActivating
        }
        
        // Track activation/deactivation
        if (isActivating) {
          trackWidgetActivation(widgetName)
        } else {
          trackWidgetDeactivation(widgetName)
        }
        
        return newState
      }
    })
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