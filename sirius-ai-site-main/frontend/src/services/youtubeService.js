const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;

export const fetchUFOVideos = async (maxResults = 12) => {
  try {
    const publishedAfter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=UFO%20UAP%20news&type=video&maxResults=${maxResults}&order=relevance&publishedAfter=${publishedAfter}&videoDefinition=any&videoDuration=any&key=${YOUTUBE_API_KEY}`;
    
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

    return videos;
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    throw new Error('Failed to fetch videos from YouTube API');
  }
};

export const getVideoDetails = async (videoId) => {
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();

    if (data.items.length === 0) {
      throw new Error('Video not found');
    }

    return data.items[0];
  } catch (error) {
    console.error('Error fetching video details:', error);
    throw new Error('Failed to fetch video details');
  }
};
