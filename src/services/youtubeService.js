export const fetchUFOVideos = async (maxResults = 12) => {
  const baseUrl = window.location.origin;
  const apiUrl = `${baseUrl}/api/youtube?maxResults=${maxResults}`;
  console.log('[Frontend] Fetching videos from:', apiUrl);
  
  try {
    const response = await fetch(apiUrl);
    console.log('[Frontend] YouTube response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const videos = await response.json();
    console.log('[Frontend] Videos received:', videos.length);
    return videos;
  } catch (error) {
    console.error('[Frontend] YouTube fetch error:', error);
    throw error;
  }
};

export const getVideoDetails = async (videoId) => {
  try {
    const response = await fetch(`/api/youtube/details?videoId=${videoId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    console.error('Error fetching video details:', error);
    throw new Error('Failed to fetch video details');
  }
};
