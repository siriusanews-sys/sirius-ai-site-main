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

const axios = require('axios');

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

  const { maxResults = 12, searchQuery = '' } = req.query;
  const searchQueries = [
    'Pentagon UAP files 2026',
    'AARO latest UFO disclosure',
    'US Congress UFO hearing news'
  ];
  const query = searchQuery || searchQueries[Math.floor(Math.random() * searchQueries.length)];
  let videos = [];

  // Fetch clean JSON via rss2json proxy to avoid XML parsing and API key requirements
  try {
    console.log('[YOUTUBE] Fetching rss2json JSON feed for query:', query);
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?search_query=${encodeURIComponent(query)}`;
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=${maxResults}`;
    const response = await axios.get(proxyUrl, { timeout: 10000 });

    if (response.data?.status === 'ok' && Array.isArray(response.data.items)) {
      videos = response.data.items.slice(0, maxResults).map(item => {
        const videoId = item.link?.match(/[?&]v=([^&]+)/)?.[1] || item.guid?.match(/([^/]+)$/)?.[1] || null;
        const thumbnailUrl = item.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null);

        if (!videoId) return null;

        return {
          video_id: videoId,
          title: item.title || 'Untitled video',
          channel: item.author || 'YouTube',
          description: (item.description || '').substring(0, 200),
          publishedAt: item.pubDate || item.date || new Date().toISOString(),
          thumbnail: thumbnailUrl,
          snippet: {
            thumbnails: {
              high: { url: thumbnailUrl },
              medium: { url: thumbnailUrl }
            }
          },
          sirius: false
        };
      }).filter(Boolean);
      console.log('[YOUTUBE] rss2json returned', videos.length, 'videos for query:', query);
    } else {
      console.log('[YOUTUBE] rss2json proxy returned invalid data', response.data?.status);
    }
  } catch (proxyError) {
    console.log('[YOUTUBE] rss2json proxy failed:', proxyError.message);
  }

  // Strategy 3: Static fallback (always works)
  if (videos.length === 0) {
    console.log('[YOUTUBE] Using static video fallback');
    videos = buildVideoList();
  }

  console.log('[YOUTUBE] Returning', videos.length, 'videos');
  return res.status(200).json(videos);
}
