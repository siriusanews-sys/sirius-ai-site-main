export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const url = `https://googleapis.com/generativeai/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
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

    const data = await response.json();

    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      const aiText = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ response: aiText });
    } else {
      throw new Error("Invalid response from Gemini API");
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: "Signal lost... Please check your connection." });
  }
}
