export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { videoId } = req.query;
    
    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    // Debug: Check environment variables
    console.log('=== YOUTUBE DETAILS API DEBUG ===');
    console.log('NEXT_PUBLIC_YOUTUBE_API_KEY exists:', !!process.env.NEXT_PUBLIC_YOUTUBE_API_KEY);
    console.log('YOUTUBE_API_KEY exists:', !!process.env.YOUTUBE_API_KEY);
    
    // Fallback: Try both variable naming conventions
    let apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY;
    
    if (!apiKey) {
      console.error('No YouTube API key found in environment variables');
      return res.status(500).json({ error: 'YouTube API key not configured' });
    }
    
    console.log('YouTube Details API Key found, length:', apiKey.length);
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`;
    
    const response = await fetch(url);
    
    // Read response body only once to prevent stream errors
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('YouTube Details API Error Response:', responseText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
    }
    
    const data = JSON.parse(responseText);

    if (data.items.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    return res.status(200).json(data.items[0]);
  } catch (error) {
    console.error('YouTube API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch video details from YouTube API' });
  }
}
