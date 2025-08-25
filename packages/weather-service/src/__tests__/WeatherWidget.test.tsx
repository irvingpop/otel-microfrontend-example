import { render, screen, waitFor } from '@testing-library/react'
import WeatherWidget from '../WeatherWidget'

describe('WeatherWidget', () => {
  it('shows loading state initially', () => {
    render(<WeatherWidget />)
    expect(screen.getByText('Loading weather data...')).toBeInTheDocument()
    expect(screen.getByText('🌤️')).toBeInTheDocument()
  })

  it('renders weather data after loading', async () => {
    render(<WeatherWidget />)
    
    await waitFor(() => {
      expect(screen.getByText('🌤️ Weather')).toBeInTheDocument()
    })

    expect(screen.getByText('Smart City Center')).toBeInTheDocument()
    expect(screen.getByText('22°C')).toBeInTheDocument()
    expect(screen.getByText('Partly Cloudy')).toBeInTheDocument()
    expect(screen.getByText('65%')).toBeInTheDocument() // humidity
    expect(screen.getByText('8 km/h')).toBeInTheDocument() // wind speed
  })

  it('displays 5-day forecast', async () => {
    render(<WeatherWidget />)
    
    await waitFor(() => {
      expect(screen.getByText('5-Day Forecast')).toBeInTheDocument()
    })

    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.getByText('Tomorrow')).toBeInTheDocument()
    expect(screen.getByText('Wednesday')).toBeInTheDocument()
    expect(screen.getByText('Thursday')).toBeInTheDocument()
    expect(screen.getByText('Friday')).toBeInTheDocument()
  })

  it('has proper styling classes', async () => {
    render(<WeatherWidget />)
    
    await waitFor(() => {
      const widget = screen.getByText('🌤️ Weather').closest('.weather-widget')
      expect(widget).toBeInTheDocument()
    })
  })
})