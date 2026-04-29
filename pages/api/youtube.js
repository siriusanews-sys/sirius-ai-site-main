export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { maxResults = 12 } = req.query;
    
    // Debug: Check environment variables
    console.log('=== YOUTUBE API DEBUG ===');
    console.log('NEXT_PUBLIC_YOUTUBE_API_KEY exists:', !!process.env.NEXT_PUBLIC_YOUTUBE_API_KEY);
    console.log('YOUTUBE_API_KEY exists:', !!process.env.YOUTUBE_API_KEY);
    console.log('All env vars:', Object.keys(process.env).filter(key => key.includes('YOUTUBE')));
    
    // Fallback: Try both variable naming conventions
    let apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY;
    
    if (!apiKey) {
      console.error('No YouTube API key found in environment variables');
      return res.status(500).json({ error: 'YouTube API key not configured' });
    }
    
    console.log('YouTube API Key found, length:', apiKey.length);
    const publishedAfter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=UFO%20UAP%20news&type=video&maxResults=${maxResults}&order=relevance&publishedAfter=${publishedAfter}&videoDefinition=any&videoDuration=any&key=${apiKey}`;
    
    console.log('YouTube API URL:', url.replace(/key=[^&]+/, 'key=***'));
    
    const response = await fetch(url);
    
    console.log('YouTube Response status:', response.status);
    console.log('YouTube Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('YouTube API Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('YouTube Response data keys:', Object.keys(data));
    console.log('YouTube Items count:', data.items?.length || 0);

    const videos = data.items.map(item => ({
      video_id: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      sirius: item.snippet.channelTitle.toLowerCase().includes('sirius')
    }));

    console.log('Processed videos count:', videos.length);
    return res.status(200).json(videos);
  } catch (error) {
    console.error('YouTube API Error:', error);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({ 
      error: error.message || 'Failed to fetch videos from YouTube API',
      stack: error.stack,
      type: error.constructor.name
    });
  }
}

export async function getVideoDetails(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { videoId } = req.query;
    
    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();

    if (data.items.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    return res.status(200).json(data.items[0]);
  } catch (error) {
    console.error('YouTube API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch video details from YouTube API' });
  }
}
