export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { maxResults = 12 } = req.query;
    
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    const publishedAfter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=UFO%20UAP%20news&type=video&maxResults=${maxResults}&order=relevance&publishedAfter=${publishedAfter}&videoDefinition=any&videoDuration=any&key=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();

    const videos = data.items.map(item => ({
      video_id: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      sirius: item.snippet.channelTitle.toLowerCase().includes('sirius')
    }));

    return res.status(200).json(videos);
  } catch (error) {
    console.error('YouTube API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch videos from YouTube API' });
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
