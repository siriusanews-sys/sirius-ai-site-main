// Curated UFO/UAP video pool - always available as fallback
const VIDEO_POOL = [
  { video_id: "j_f7EsS9_XU", title: "SiriusAnews: Latest UFO/UAP Report", channel: "SiriusAnews", sirius: true },
  { video_id: "PfSXkfV_mhA", title: "Pentagon UFO Videos: Official Release", channel: "CBS News", sirius: false },
  { video_id: "ZBtMbBPzqHY", title: "Navy Pilots Describe UFO Encounters", channel: "60 Minutes", sirius: false },
  { video_id: "rO_M0hLlJ-Q", title: "The Rendlesham Forest Incident", channel: "History Channel", sirius: false },
  { video_id: "2TumprpOwHY", title: "Phoenix Lights: The Full Story", channel: "VICE", sirius: false },
  { video_id: "SpeSpA3e56A", title: "What We Know About UAPs", channel: "Vox", sirius: false },
  { video_id: "KQ7Hk70JjLg", title: "Top 10 Most Credible UFO Sightings", channel: "Discovery", sirius: false },
  { video_id: "mtM7NbHF0-0", title: "Unexplained Mysteries: Aliens & UFOs", channel: "Mystery Files", sirius: false },
  { video_id: "Jr0JaXfXUvU", title: "Ryan Graves on UAPs", channel: "60 Minutes", sirius: false },
  { video_id: "pWwwTSJwhmw", title: "David Fravor Tic Tac UFO Encounter", channel: "Lex Fridman", sirius: false },
  { video_id: "FCEnaC4UqAE", title: "David Grusch Whistleblower Hearing", channel: "C-SPAN", sirius: false },
  { video_id: "ZrsVVGgANC8", title: "Avi Loeb on Interstellar Objects", channel: "Lex Fridman", sirius: false }
].map(v => ({
  ...v,
  thumbnail: `https://img.youtube.com/vi/${v.video_id}/mqdefault.jpg`,
  publishedAt: new Date().toISOString(),
  description: "UFO/UAP related video"
}));

// Shuffle helper
const shuffleArray = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Build video list: SiriusAnews always first, others shuffled
const buildVideoList = () => {
  const sirius = VIDEO_POOL.find(v => v.sirius);
  const others = shuffleArray(VIDEO_POOL.filter(v => !v.sirius));
  return [sirius, ...others.slice(0, 11)];
};

module.exports = async function handler(req, res) {
  console.log(`[YOUTUBE] ${req.method} request received from ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { maxResults = 12 } = req.query;
  let videos = [];

  // Strategy 1: Try YouTube Data API if key is available
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (apiKey) {
    try {
      console.log('[YOUTUBE] Trying YouTube Data API v3...');
      const publishedAfter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=UFO%20UAP%20news&type=video&maxResults=${maxResults}&order=relevance&publishedAfter=${publishedAfter}&key=${apiKey}`;
      
      const response = await fetch(url, { timeout: 8000 });
      console.log('[YOUTUBE] YouTube API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          videos = data.items.map(item => ({
            video_id: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            description: item.snippet.description?.substring(0, 200) || '',
            publishedAt: item.snippet.publishedAt,
            thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
            sirius: item.snippet.channelTitle.toLowerCase().includes('sirius')
          }));
          console.log('[YOUTUBE] YouTube API returned', videos.length, 'videos');
        }
      }
    } catch (apiError) {
      console.log('[YOUTUBE] YouTube API failed:', apiError.message);
    }
  } else {
    console.log('[YOUTUBE] No YouTube API key found, skipping API attempt');
  }

  // Strategy 2: Try RSS if API failed or no key
  if (videos.length === 0) {
    try {
      console.log('[YOUTUBE] Trying RSS feed...');
      const rssUrl = encodeURIComponent('https://www.youtube.com/feeds/videos.xml?search_query=UFO+UAP+news');
      const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}&count=${maxResults}`, { timeout: 5000 });
      
      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          videos = data.items.map(item => {
            const match = item.link.match(/v=([^&]+)/);
            const videoId = match ? match[1] : null;
            return videoId ? {
              video_id: videoId,
              title: item.title,
              channel: item.author || 'YouTube',
              description: item.description?.substring(0, 200) || '',
              publishedAt: item.pubDate,
              thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
              sirius: item.author?.toLowerCase().includes('sirius') || false
            } : null;
          }).filter(Boolean);
          console.log('[YOUTUBE] RSS returned', videos.length, 'videos');
        }
      }
    } catch (rssError) {
      console.log('[YOUTUBE] RSS failed:', rssError.message);
    }
  }

  // Strategy 3: Static fallback (always works)
  if (videos.length === 0) {
    console.log('[YOUTUBE] Using static video fallback');
    videos = buildVideoList();
  }

  console.log('[YOUTUBE] Returning', videos.length, 'videos');
  return res.status(200).json(videos);
}
