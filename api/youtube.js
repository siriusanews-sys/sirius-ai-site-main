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
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Try to fetch from RSS feeds (no API key needed)
    const rssFeeds = [
      'https://www.youtube.com/feeds/videos.xml?channel_id=UC7OqXqhcRZG4HN2MFK8Zjfg', // Example UFO channel
      'https://www.youtube.com/feeds/videos.xml?channel_id=UCBSnHDm6JcxpI2aAFlWnPJQ'  // Another UFO channel
    ];

    let videos = [];
    
    // Try RSS fetch via rss2json (free, no key needed for basic use)
    try {
      const rssUrl = encodeURIComponent('https://www.youtube.com/feeds/videos.xml?search_query=UFO+UAP+news');
      const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}&count=12`, { timeout: 5000 });
      
      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          videos = data.items.map(item => {
            // Extract video ID from YouTube link
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
        }
      }
    } catch (rssError) {
      console.log('RSS fetch failed, using fallback:', rssError.message);
    }

    // If RSS failed or returned no videos, use fallback pool
    if (videos.length === 0) {
      console.log('Using curated video fallback');
      videos = buildVideoList();
    }

    console.log('Returning', videos.length, 'videos');
    return res.status(200).json(videos);
  } catch (error) {
    console.error('YouTube Error:', error);
    
    // Always return fallback videos, never an error
    const fallback = buildVideoList();
    console.log('Error occurred, returning fallback videos:', fallback.length);
    return res.status(200).json(fallback);
  }
}
