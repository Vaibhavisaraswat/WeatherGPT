export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { question, weatherContext } = req.body

  const apiKey = process.env.GROQ_API_KEY

  const prompt = `You are a helpful weather assistant for Indian users, including farmers in rural areas. Answer simply and practically.

Current weather data: ${JSON.stringify(weatherContext)}

User question: ${question}`

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const data = await response.json()
    console.log('Groq raw response:', JSON.stringify(data))
    const reply = data.choices?.[0]?.message?.content || 'No reply received'

    res.status(200).json({ reply })
  } catch (err) {
    console.error('CHAT ERROR:', err)
    res.status(500).json({ error: 'Failed to get AI response' })
  }
}