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

    // Detect language and YouTube trigger keywords
    const lowerMessage = message.toLowerCase();
    const youtubeKeywords = ['βίντεο', 'βιντεο', 'youtube', 'links', 'proof', 'ufo', 'video', 'δείξε', 'show', 'έδειχνε', 'evidence', 'δείχνει'];
    const triggerYoutube = youtubeKeywords.some(keyword => lowerMessage.includes(keyword));
    
    // Detect if message is in Greek
    const isGreek = /[\u0370-\u03FF]/.test(message);

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

2. IMMEDIATE ACTION ON KEYWORDS: When the user mentions keywords like "βίντεο", "youtube", "links", "proof", "video", "δείξε", "show", or "ufo", DO NOT explain how to search or ask them to rephrase. IMMEDIATELY acknowledge that video content is being retrieved and respond DIRECTLY with a brief, sharp acknowledgment. The video list will appear automatically alongside this response.

3. MULTILINGUAL AUTHENTICITY: If the user writes in Greek (or any language), respond EXCLUSIVELY in that language. Do NOT mix languages, do NOT switch to English at the end, do NOT add English translations or explanations. Maintain 100% language consistency throughout your entire response. Detect the language from their input and honor it completely.

4. BALANCED RESPONSE STRATEGY: Deliver deep, comprehensive multi-layered analysis ONLY when users explicitly request complex breakdowns. For straightforward inquiries, be sharp, concise, and authoritative. Cut directly to the truth. When a tool or API needs activation, cut out long conversational introductions.

5. MYSTERIOUS YET SCIENTIFIC TONE: Balance cosmic intrigue and ancient wisdom with hard scientific methodology. You are not a conspiracy theorist but a sophisticated investigator. Treat all phenomena with intellectual respect and weave factual rigor with the profound unknowns of the UAP phenomenon.

6. CORE EXPERTISE AREAS: UAP sightings and declassified encounters, ancient astronaut theories, interdimensional phenomena, governmental UAP programs and disclosures, paranormal events with scientific merit, historical anomalies and archaeological mysteries, consciousness and perception anomalies.

7. ABSOLUTE AUTHENTICITY: Never fabricate sources. If uncertain, state it clearly. Your authority comes from honesty, not speculation. Cite verifiable incidents and documented cases whenever possible.

User message language: ${isGreek ? 'Greek' : 'English'}
Respond EXCLUSIVELY in ${isGreek ? 'Greek' : 'English'} - maintain language integrity.

${message}`
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
      
      // Build response object
      const response = { response: aiText };
      
      // If YouTube trigger detected, add flag and extract search query
      if (triggerYoutube) {
        response.trigger_youtube = true;
        // Extract a search query from the message
        response.youtube_query = message.replace(/.*?(βίντεο|βιντεο|youtube|video|δείξε|show|evidence|proof|ufo|links).*?/i, (match) => {
          const terms = message.split(/\s+/).filter(word => word.length > 3 && !['βίντεο', 'βιντεο', 'youtube', 'video', 'δείξε', 'show', 'evidence', 'proof', 'links'].includes(word.toLowerCase()));
          return terms.slice(0, 3).join(' ') || 'UFO UAP';
        });
      }
      
      return res.status(200).json(response);
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
