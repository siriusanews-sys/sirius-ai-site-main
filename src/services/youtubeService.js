export const fetchUFOVideos = async (maxResults = 12) => {
  try {
    const response = await fetch(`/api/youtube?maxResults=${maxResults}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const videos = await response.json();
    return videos;
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    throw new Error('Failed to fetch videos from YouTube API');
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
