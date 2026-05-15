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

import axios from 'axios';

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

const ALLOWED_CHANNEL_IDS = [
  'UCwS08w9FaCbywN9Nsh0rcbA', // NewsNation
  'UCzQUP1qoWDoEbmsQxvdjxgQ', // Joe Rogan (PowerfulJRE)
  'UC8Cl9QaRtu0m9Fca7p97uWg', // Anonymous Official
  'UCqvd_wI_4vWv9Y46G8w7Wqw', // Reuters
  'UCXIJgGwBQKuHte_6uY3SGwA', // Fox News
  'UC786Hba2W8L_IDV_T39Y8Cg', // Mirror Now
  'UCb369XInT_jRno68E7XNffA', // David Icke
  'UC_vS08w9FaCbywN9Nsh0rcbA'  // SiriusANews
];

export default async function handler(req, res) {
  console.log(`[YOUTUBE] ${req.method} request received from ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { maxResults = 8 } = req.query;
  const selectedChannel = ALLOWED_CHANNEL_IDS[Math.floor(Math.random() * ALLOWED_CHANNEL_IDS.length)];
  let videos = [];

  // Strategy 1: Official YouTube Data API using the selected allowed channel
  const apiKey = process.env.REACT_APP_YOUTUBE_API_KEY;
  if (apiKey) {
    try {
      console.log('[YOUTUBE] Using YouTube Data API v3 for channel:', selectedChannel);
      const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${selectedChannel}&type=video&maxResults=${maxResults}&order=date&key=${apiKey}`;
      const ytResponse = await axios.get(ytUrl, {
        timeout: 15000,
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache'
        }
      });

      if (Array.isArray(ytResponse.data?.items) && ytResponse.data.items.length > 0) {
        videos = ytResponse.data.items.map(item => ({
          video_id: item.id.videoId,
          title: item.snippet.title,
          channel: item.snippet.channelTitle,
          description: item.snippet.description?.substring(0, 200) || '',
          publishedAt: item.snippet.publishedAt,
          thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || `https://img.youtube.com/vi/${item.id.videoId}/mqdefault.jpg`,
          snippet: item.snippet,
          sirius: item.snippet.channelTitle?.toLowerCase().includes('sirius') || false
        }));
        console.log('[YOUTUBE] YouTube Data API returned', videos.length, 'videos from channel:', selectedChannel);
      }
    } catch (apiError) {
      console.log('[YOUTUBE] YouTube Data API failed:', apiError.message);
    }
  }

  // Strategy 2: XML fallback from an unblocked global disclosure search feed
  if (videos.length === 0) {
    try {
      const query = 'Pentagon UFO 2026';
      console.log('[YOUTUBE] Falling back to live XML search feed for query:', query);
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?search_query=${encodeURIComponent(query)}`;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}&_=${Date.now()}`;
      const response = await axios.get(proxyUrl, {
        timeout: 15000,
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache'
        }
      });

      if (typeof response.data === 'string') {
        const entries = Array.from(response.data.matchAll(/<entry>([\s\S]*?)<\/entry>/g));
        videos = entries.slice(0, maxResults).map(entryMatch => {
          const entry = entryMatch[1];
          const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] || null;
          const title = entry.match(/<title>([^<]+)<\/title>/)?.[1] || 'Untitled video';
          const channel = entry.match(/<author>\s*<name>([^<]+)<\/name>/)?.[1] || 'YouTube';
          const description = entry.match(/<media:description[^>]*>([\s\S]*?)<\/media:description>/)?.[1]?.trim() || '';
          const publishedAt = entry.match(/<published>([^<]+)<\/published>/)?.[1] || '';
          const thumbnailUrl = entry.match(/<media:thumbnail[^>]*url="([^\"]+)"/)?.[1] || (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null);

          if (!videoId) return null;

          return {
            video_id: videoId,
            title,
            channel,
            description: description.substring(0, 200),
            publishedAt,
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
        console.log('[YOUTUBE] XML search feed returned', videos.length, 'videos');
      } else {
        console.log('[YOUTUBE] Unexpected RSS response format');
      }
    } catch (proxyError) {
      console.log('[YOUTUBE] XML search proxy failed:', proxyError.message);
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
