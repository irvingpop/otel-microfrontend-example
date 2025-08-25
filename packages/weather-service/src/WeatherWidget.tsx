import React, { useState, useEffect } from 'react'
import './WeatherWidget.css'

interface WeatherData {
  location: string
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  forecast: Array<{
    day: string
    high: number
    low: number
    condition: string
    icon: string
  }>
}

const mockWeatherData: WeatherData = {
  location: "Smart City Center",
  temperature: 22,
  condition: "Partly Cloudy",
  humidity: 65,
  windSpeed: 8,
  forecast: [
    { day: "Today", high: 24, low: 18, condition: "Partly Cloudy", icon: "🌤️" },
    { day: "Tomorrow", high: 26, low: 20, condition: "Sunny", icon: "☀️" },
    { day: "Wednesday", high: 23, low: 17, condition: "Rainy", icon: "🌧️" },
    { day: "Thursday", high: 25, low: 19, condition: "Cloudy", icon: "☁️" },
    { day: "Friday", high: 27, low: 21, condition: "Sunny", icon: "☀️" }
  ]
}

export const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setWeather(mockWeatherData)
      setLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny': return '☀️'
      case 'partly cloudy': return '🌤️'
      case 'cloudy': return '☁️'
      case 'rainy': return '🌧️'
      case 'stormy': return '⛈️'
      default: return '🌤️'
    }
  }

  if (loading) {
    return (
      <div className="weather-widget loading">
        <div className="weather-spinner">🌤️</div>
        <p>Loading weather data...</p>
      </div>
    )
  }

  if (!weather) {
    return (
      <div className="weather-widget error">
        <h3>❌ Weather Unavailable</h3>
        <p>Unable to load weather data</p>
      </div>
    )
  }

  return (
    <div className="weather-widget">
      <div className="weather-header">
        <h3>🌤️ Weather</h3>
        <span className="location">{weather.location}</span>
      </div>
      
      <div className="current-weather">
        <div className="temperature-display">
          <span className="temp">{weather.temperature}°C</span>
          <span className="icon">{getWeatherIcon(weather.condition)}</span>
        </div>
        <div className="condition">{weather.condition}</div>
      </div>

      <div className="weather-details">
        <div className="detail">
          <span className="label">💧 Humidity</span>
          <span className="value">{weather.humidity}%</span>
        </div>
        <div className="detail">
          <span className="label">💨 Wind</span>
          <span className="value">{weather.windSpeed} km/h</span>
        </div>
      </div>

      <div className="forecast">
        <h4>5-Day Forecast</h4>
        <div className="forecast-grid">
          {weather.forecast.map((day, index) => (
            <div key={index} className="forecast-day">
              <div className="day-name">{day.day}</div>
              <div className="day-icon">{day.icon}</div>
              <div className="day-temps">
                <span className="high">{day.high}°</span>
                <span className="low">{day.low}°</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default WeatherWidget