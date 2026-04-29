export const fetchUFOVideos = async (maxResults = 12) => {
  try {
    const response = await fetch(`/api/youtube?maxResults=${maxResults}`);
    
    // Read response body only once to prevent stream errors
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('YouTube API Error Response:', responseText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
    }
    
    const videos = JSON.parse(responseText);
    return videos;
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    throw new Error('Failed to fetch videos from YouTube API');
  }
};

export const getVideoDetails = async (videoId) => {
  try {
    const response = await fetch(`/api/youtube/details?videoId=${videoId}`);
    
    // Read response body only once to prevent stream errors
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('YouTube Details API Error Response:', responseText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
    }
    
    const data = JSON.parse(responseText);

    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    console.error('Error fetching video details:', error);
    throw new Error('Failed to fetch video details');
  }
};
