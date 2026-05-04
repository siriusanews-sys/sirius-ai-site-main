export const fetchUFOVideos = async (maxResults = 12) => {
  const baseUrl = window.location.origin;
  const apiUrl = `${baseUrl}/api/youtube?maxResults=${maxResults}`;
  
  try {
    const res = await fetch(apiUrl);
    const videos = await res.json();
    
    if (videos.error) {
      throw new Error(videos.error);
    }
    
    return videos;
  } catch (error) {
    console.error('[Frontend] YouTube fetch error:', error);
    throw error;
  }
};

export const getVideoDetails = async (videoId) => {
  try {
    const res = await fetch(`/api/youtube/details?videoId=${videoId}`);
    const data = await res.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    console.error('Error fetching video details:', error);
    throw new Error('Failed to fetch video details');
  }
};
