import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [searchText, setSearchText] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [weatherCondition, setWeatherCondition] = useState('cloudy')
  const [chatMessages, setChatMessages] = useState([])
const [chatInput, setChatInput] = useState('')
const [isChatLoading, setIsChatLoading] = useState(false)

  async function handleSearchChange(e) {
    const text = e.target.value
    setSearchText(text)

    if (text.length < 3) {
      setSuggestions([])
      return
    }

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${text}&count=5&language=en`
    const response = await fetch(url)
    const data = await response.json()

    if (data.results) {
      setSuggestions(data.results)
    } else {
      setSuggestions([])
    }
  }

  function handleSelectPlace(place) {
    setSelectedPlace(place)
    setSearchText(`${place.name}, ${place.admin1}, ${place.country}`)
    setSuggestions([])
  }

  function getAlerts(current, daily) {
  const alerts = []

  if (!current || !daily) return alerts

  if (daily.precipitation_probability_max[0] >= 70) {
    alerts.push({
      icon: '🌧️',
      message: 'Heavy rain expected today. Carry an umbrella and avoid low-lying areas.'
    })
  }

  if (daily.temperature_2m_max[0] >= 40) {
    alerts.push({
      icon: '🔥',
      message: 'Extreme heat warning. Stay hydrated and avoid outdoor work during peak hours.'
    })
  }

  if (current.wind_speed_10m >= 40) {
    alerts.push({
      icon: '💨',
      message: 'Strong winds expected. Secure loose items outdoors.'
    })
  }

  return alerts
}
function getWeatherCondition(code, windSpeed) {
  if (windSpeed >= 35) return 'windy'
  if (code === 0 || code === 1) return 'sunny'
  if (code >= 71 && code <= 77) return 'snowy'
  if (code >= 51 && code <= 67) return 'rainy'
  if (code >= 80 && code <= 82) return 'rainy'
  if (code >= 95) return 'rainy'
  return 'cloudy'
}
function getWeatherIcon(condition) {
  if (condition === 'sunny') return '☀️'
  if (condition === 'rainy') return '🌧️'
  if (condition === 'snowy') return '❄️'
  if (condition === 'windy') return '💨'
  return '☁️'
}

async function sendChatMessage() {
  if (!chatInput.trim()) return

  const userMessage = chatInput
  setChatMessages((prev) => [...prev, { role: 'user', text: userMessage }])
  setChatInput('')
  setIsChatLoading(true)

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: userMessage,
        weatherContext: { current: weather, daily: forecast }
      })
    })

    const data = await response.json()
    setChatMessages((prev) => [...prev, { role: 'ai', text: data.reply }])
  } catch (err) {
    setChatMessages((prev) => [...prev, { role: 'ai', text: 'Sorry, something went wrong.' }])
  } finally {
    setIsChatLoading(false)
  }
}

  useEffect(() => {
    if (!selectedPlace) return

        async function fetchWeather() {
      setIsLoading(true)
      setError(null)

      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${selectedPlace.latitude}&longitude=${selectedPlace.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`
        const response = await fetch(url)
        const data = await response.json()
        setWeather(data.current)
        setForecast(data.daily)
        setAlerts(getAlerts(data.current, data.daily))
        setWeatherCondition(getWeatherCondition(data.current.weather_code, data.current.wind_speed_10m))
      } catch (err) {
        console.error('Fetch error:', err)
        setError('Could not load weather data. Please check your internet connection.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchWeather()
  }, [selectedPlace])

    return (
      <>
    <div className={`bg-clouds bg-${weatherCondition}`}>
  <div className="cloud cloud-1"></div>
  <div className="cloud cloud-2"></div>
  <div className="cloud cloud-3"></div>
  {weatherCondition === 'rainy' && (
    <div className="rain-container">
      {Array.from({ length: 40 }).map((_, i) => (
        <div className="raindrop" key={i} style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s`, animationDuration: `${0.5 + Math.random() * 0.5}s` }}></div>
      ))}
    </div>
  )}
  {weatherCondition === 'snowy' && (
    <div className="snow-container">
      {Array.from({ length: 30 }).map((_, i) => (
        <div className="snowflake" key={i} style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s`, animationDuration: `${5 + Math.random() * 5}s` }}>❄</div>
      ))}
    </div>
  )}
</div>

    <div className="app">
      <div className="hero">
        <h1>WeatherGPT</h1>
      </div>

      <input
        className="search-box"
        type="text"
        placeholder="Search for a location..."
        value={searchText}
        onChange={handleSearchChange}
      />

      {suggestions.length > 0 && (
  <ul className="suggestions">
    {suggestions.map((place) => (
      <li key={place.id} onClick={() => handleSelectPlace(place)}>
        <span className="pin-icon">📍</span>
        <div>
          <p className="suggestion-name">{place.name}</p>
          <p className="suggestion-region">{place.admin1}, {place.country}</p>
        </div>
      </li>
    ))}
  </ul>
)}

      {isLoading && (
  <div className="loader">
    <div className="spinner"></div>
    <p>Fetching weather...</p>
  </div>
)}
      {error && <p style={{ color: 'var(--alert-red)' }}>{error}</p>}

      {alerts.length > 0 && (
  <div className="card alert-card">
    <h3>Weather Alerts</h3>
    {alerts.map((alert, index) => (
      <div className="alert-item" key={index}>
        <span className="alert-icon">{alert.icon}</span>
        <p>{alert.message}</p>
      </div>
    ))}
  </div>
)}
      {weather && (
  <div className="card weather-hero">
    <p className="weather-icon">{getWeatherIcon(weatherCondition)}</p>
    <p className="temp-big">{Math.round(weather.temperature_2m)}°</p>
    <div className="weather-stats">
      <span>💧 {weather.relative_humidity_2m}% humidity</span>
      <span>💨 {weather.wind_speed_10m} km/h wind</span>
      <span>🌧️ {weather.precipitation} mm rain</span>
    </div>
  </div>
)}
      {forecast && (
  <div className="card">
    <h3>7-Day Forecast</h3>
    <div className="forecast-grid">
      {forecast.time.map((day, index) => (
        <div className="forecast-day" key={day}>
          <p className="forecast-date">
            {new Date(day).toLocaleDateString('en-US', { weekday: 'short' })}
          </p>
          <p className="forecast-rain">🌧️ {forecast.precipitation_probability_max[index]}%</p>
          <p className="forecast-temp">
            {Math.round(forecast.temperature_2m_max[index])}° / {Math.round(forecast.temperature_2m_min[index])}°
          </p>
        </div>
      ))}
    </div>
  </div>
)}
      <div className="card">
  <h3>Ask WeatherGPT</h3>
  <div className="chat-window">
    {chatMessages.length === 0 && (
      <p className="chat-empty">Ask me anything about today's weather — like "Should I water my crops today?"</p>
    )}
    {chatMessages.map((msg, index) => (
      <div className={msg.role === 'user' ? 'chat-bubble chat-user' : 'chat-bubble chat-ai'} key={index}>
        {msg.text}
      </div>
    ))}
    {isChatLoading && <div className="chat-bubble chat-ai">Typing...</div>}
  </div>
  <div className="chat-input-row">
    <input
      className="search-box"
      type="text"
      placeholder="Ask about the weather..."
      value={chatInput}
      onChange={(e) => setChatInput(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') sendChatMessage()
      }}
    />
    <button onClick={sendChatMessage}>Send</button>
  </div>
</div>
</div>
</>

  )
}

export default App