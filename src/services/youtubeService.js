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

/**
 * Fetch verified global UAP/UFO disclosure news videos
 * Used for the independent Live Feed at the bottom
 */
export const fetchDisclosureNewsVideos = async (maxResults = 12) => {
  const baseUrl = window.location.origin;
  
  // Verified search queries for the latest disclosure news
  const searchQueries = [
    'Pentagon UAP files 2026',
    'AARO latest UFO disclosure',
    'US Congress UFO hearing news'
  ];
  
  // Randomly pick one of the latest search queries for fresh live coverage
  const selectedQuery = searchQueries[Math.floor(Math.random() * searchQueries.length)];
  const apiUrl = `${baseUrl}/api/youtube?maxResults=${maxResults}&searchQuery=${encodeURIComponent(selectedQuery)}&order=date`;
  
  try {
    const res = await axios.get(apiUrl);
    const videos = res.data;
    
    if (videos.error) {
      throw new Error(videos.error);
    }
    
    return videos;
  } catch (error) {
    console.error('[Frontend] Disclosure news fetch error:', error);
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
