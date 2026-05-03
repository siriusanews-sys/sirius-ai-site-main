module.exports = async function handler(req, res) {
  console.log(`[GEMINI] ${req.method} request received from ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check API key
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('[GEMINI] No API key found');
      return res.status(500).json({ error: 'Gemini API key not configured in Vercel environment variables' });
    }
    
    console.log('[GEMINI] API Key found, length:', apiKey.length);
    
    // Call Gemini API with separate try-catch
    let geminiResponse;
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      
      geminiResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ 
              text: `You are Sirius AI, a UFO/UAP expert. Answer: ${message}` 
            }] 
          }],
          generationConfig: { maxOutputTokens: 1000 }
        })
      });
    } catch (fetchError) {
      console.error('[GEMINI] Fetch failed:', fetchError.message);
      return res.status(502).json({ 
        error: 'Cannot reach Gemini API. Check if your region supports Gemini API.' 
      });
    }

    console.log('[GEMINI] Gemini response status:', geminiResponse.status);
    
    // Parse response only once
    let data;
    try {
      data = await geminiResponse.json();
    } catch (parseError) {
      console.error('[GEMINI] JSON parse failed:', parseError.message);
      return res.status(502).json({ error: 'Invalid response from Gemini API' });
    }

    // Handle Gemini API errors
    if (!geminiResponse.ok) {
      console.error('[GEMINI] Gemini API error:', data);
      const errorMsg = data?.error?.message || `Gemini API error: ${geminiResponse.status}`;
      return res.status(502).json({ error: errorMsg });
    }

    // Extract AI response
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      const aiText = data.candidates[0].content.parts[0].text;
      console.log('[GEMINI] Success, response length:', aiText.length);
      return res.status(200).json({ response: aiText });
    } else {
      console.error('[GEMINI] Unexpected response structure:', data);
      return res.status(502).json({ error: 'Unexpected response from Gemini API' });
    }
  } catch (error) {
    console.error('[GEMINI] Unexpected error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}
