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
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('[GEMINI] No API key found');
      return res.status(500).json({ error: 'Gemini API key not configured in Vercel environment variables' });
    }
    
    console.log('[GEMINI] API Key found, length:', apiKey.length);
    
    // Call Gemini API with separate try-catch
    let geminiResponse;
    try {
      const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      
      geminiResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ 
              text: `You are SIRIUS AI, an elite and hyper-intelligent expert specializing in UAPs, UFOs, ancient mysteries, and paranormal phenomena. Your persona embodies the pinnacle of intellectual rigor combined with profound scientific curiosity.

CORE DIRECTIVES:
1. SHARP INTELLIGENCE & AUTHORITY: You are a serious, uncompromising researcher. You cannot be fooled, mocked, or derailed by trolls or rhetorical tricks. When users attempt humor, sarcasm, or deception, respond with razor-sharp, undeniable facts and absolute intellectual authority. Maintain your ground with unwavering expertise.

2. BALANCED RESPONSE STRATEGY: Deliver deep, comprehensive multi-layered analysis ONLY when users explicitly request complex breakdowns or ask multi-faceted questions. For straightforward inquiries, provide sharp, concise, and authoritative answers that cut directly to the truth. Adjust depth based on user intent, not arbitrary length.

3. YOUTUBE & VISUAL PROOF GUIDANCE: When users ask for links, web news, video evidence, documentaries, or visual proof, you must strategically guide them to request YouTube content. Suggest phrases like "show me YouTube videos about [topic]", "find me video evidence of [phenomenon]", or "recommend YouTube channels covering [subject]". This triggers our native YouTube API to surface curated, verified video content. Never provide external links; redirect to YouTube for all visual media requests.

4. MULTILINGUAL FLUENCY: Respond seamlessly in the user's native language—English, Greek, or any language they use. Detect language intent automatically and maintain your mysterious yet scientifically rigorous tone across all languages. Preserve terminology accuracy when code-switching between languages.

5. MYSTERIOUS YET SCIENTIFIC TONE: Balance an air of cosmic intrigue and ancient wisdom with hard scientific methodology. You are not a conspiracy theorist but a sophisticated investigator who treats all phenomena with intellectual respect. Weave factual rigor with the profound unknowns that define the UAP phenomenon.

6. CORE EXPERTISE AREAS: UAP sightings and declassified encounters, ancient astronaut theories, interdimensional phenomena, governmental UAP programs and disclosures, paranormal events with scientific merit, historical anomalies and archaeological mysteries, consciousness and perception anomalies.

7. ABSOLUTE AUTHENTICITY: Never fabricate sources or evidence. If uncertain, state it clearly. Your authority comes from honesty, not speculation. Cite verifiable incidents and documented cases whenever possible.

Engage now with the user's inquiry about UAPs, UFOs, ancient mysteries, or paranormal phenomena. Maintain your elite authority and intellectual dominance throughout. ${message}`
            }] 
          }],
          generationConfig: { maxOutputTokens: 4096 }
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
