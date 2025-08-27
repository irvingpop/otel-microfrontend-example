import React, { useState, useEffect } from 'react'

export const EnergyWidget: React.FC = () => {
  const [data, setData] = useState({
    current: 1247,
    renewable: 68,
    peak: 1580,
    efficiency: 92,
    carbonSaved: 248
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial load delay, then notify parent
    const timer = setTimeout(() => {
      setLoading(false)
      
      // Notify parent that widget has loaded
      window.parent.postMessage({
        type: 'WIDGET_LOADED',
        service: 'energy-service',
        data: {
          current_usage: data.current,
          renewable_percentage: data.renewable,
          peak_today: data.peak,
          efficiency: data.efficiency,
          carbon_saved: data.carbonSaved
        }
      }, '*')
    }, 500)
    
    const interval = setInterval(() => {
      setData(prev => ({
        ...prev,
        current: Math.floor(Math.random() * 200) + 1200,
        renewable: Math.floor(Math.random() * 10) + 65,
        efficiency: Math.floor(Math.random() * 5) + 90
      }))
    }, 5000)
    
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [])

  return (
    <div style={{padding: '1.5rem', background: 'linear-gradient(135deg, #00b894 0%, #55a3ff 100%)', color: 'white', borderRadius: '12px'}}>
      <h3 style={{margin: '0 0 1.5rem 0', fontSize: '1.25rem'}}>⚡ Energy Grid</h3>
      
      <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem'}}>
        <div>
          <div style={{marginBottom: '1rem'}}>
            <div style={{fontSize: '0.9rem', opacity: 0.8}}>Current Usage</div>
            <div style={{fontSize: '2.2rem', fontWeight: '300', lineHeight: 1}}>{data.current} MW</div>
          </div>
          
          <div style={{background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
              <span style={{fontSize: '0.85rem'}}>Renewable Sources</span>
              <span style={{fontSize: '1.1rem', fontWeight: 'bold'}}>{data.renewable}%</span>
            </div>
            <div style={{background: 'rgba(255,255,255,0.2)', borderRadius: '10px', height: '8px', overflow: 'hidden'}}>
              <div style={{background: '#00b894', width: `${data.renewable}%`, height: '100%', borderRadius: '10px', transition: 'width 0.3s ease'}}></div>
            </div>
          </div>
        </div>
        
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          <div style={{textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px'}}>
            <div style={{fontSize: '0.8rem', opacity: 0.8}}>Peak Today</div>
            <div style={{fontSize: '1.3rem', fontWeight: 'bold'}}>{data.peak} MW</div>
          </div>
          
          <div style={{textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px'}}>
            <div style={{fontSize: '0.8rem', opacity: 0.8}}>Efficiency</div>
            <div style={{fontSize: '1.3rem', fontWeight: 'bold'}}>{data.efficiency}%</div>
          </div>
          
          <div style={{textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px'}}>
            <div style={{fontSize: '0.8rem', opacity: 0.8}}>CO₂ Saved</div>
            <div style={{fontSize: '1.1rem', fontWeight: 'bold'}}>{data.carbonSaved}kg</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnergyWidget