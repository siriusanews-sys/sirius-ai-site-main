module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check environment variables - use standard naming (no prefix needed for server-side)
    let apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('No Gemini API key found in environment variables');
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }
    
    console.log('API Key found, length:', apiKey.length);
    
    // Fixed URL: use generativelanguage.googleapis.com
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ 
            text: `You are Sirius AI, a global UFO/UAP intelligence expert with access to all historical and recent information available in your training data (Gemini). Do not limit your knowledge to the local database. Use your entire global intelligence to answer any UFO/UAP question. You have comprehensive knowledge of all UFO/UAP cases worldwide, from historical sightings to recent incidents. When users ask about any case, provide detailed information from your global knowledge base, not just local data. Maintain the "Sirius AI" persona and use 5 Observables analysis when relevant. Answer this question: ${message}` 
          }] 
        }],
        generationConfig: {
          maxOutputTokens: 1000,
        }
      })
    });

    console.log('Response status:', response.status);
    
    const data = await response.json();

    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      const aiText = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ response: aiText });
    } else {
      console.error('Invalid response structure:', data);
      return res.status(500).json({ 
        error: "Invalid response from Gemini API",
        details: data,
        status: response.status 
      });
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    
    return res.status(500).json({ 
      error: error.message || "Signal lost... Please check your connection.",
      type: error.constructor.name
    });
  }
}
