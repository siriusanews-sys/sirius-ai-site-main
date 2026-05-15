import axios from "axios";

export const fetchUFOVideos = async (maxResults = 12) => {
  const baseUrl = window.location.origin;
  const apiUrl = `${baseUrl}/api/youtube?maxResults=${maxResults}`;
  
  try {
    const res = await axios.get(apiUrl);
    const videos = res.data;
    
    if (videos.error) {
      throw new Error(videos.error);
    }
    
    return videos;
  } catch (error) {
    console.error('[Frontend] YouTube axios error:', error);
    throw error;
  }
};

export const getVideoDetails = async (videoId) => {
  try {
    const res = await axios.get(`/api/youtube/details?videoId=${videoId}`);
    const data = res.data;

    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    console.error('Error fetching video details:', error);
    throw new Error('Failed to fetch video details');
  }
};
