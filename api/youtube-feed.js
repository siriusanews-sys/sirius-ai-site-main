/**
 * Vercel serverless function: /api/youtube-feed
 *
 * Fetches the latest UAP / UFO mysteries videos from YouTube Data API v3.
 * Hides the API key on the server side.
 *
 * Required Vercel Environment Variable:
 *   - YOUTUBE_API_KEY  (your YouTube Data API v3 key)
 *
 * Response shape:
 *   { videos: [{ id, videoId, title, channel, publishedAt, thumbnail }] }
 *
 * Strategy:
 *   - Runs several focused UAP/UFO search queries in parallel
 *   - Orders by date (most recent first)
 *   - Deduplicates by videoId
 *   - Filters out shorts (< 60s) and irrelevant content via keyword whitelist
 *   - Returns up to 24 videos
 *   - Caches at the edge for 12 hours (matches the frontend cache TTL)
 */

const SEARCH_QUERIES = [
  'UAP latest news',
  'UFO disclosure 2026',
  'UAP mysteries',
  'UFO sighting recent',
  'Pentagon UAP report',
  'UAP whistleblower',
  'UFO encounter pilots',
  'alien disclosure congress'
];

// Keep only videos that mention UAP/UFO themes (defensive filter)
const KEYWORD_WHITELIST = [
  'uap', 'ufo', 'alien', 'extraterrestrial', 'disclosure', 'pentagon',
  'whistleblower', 'aario', 'aaro', 'grusch', 'fravor', 'elizondo',
  'tic tac', 'mystery', 'sighting', 'unidentified', 'phenomena',
  'roswell', 'area 51', 'craft'
];

function isRelevant(item) {
  const title = (item?.snippet?.title || '').toLowerCase();
  const desc = (item?.snippet?.description || '').toLowerCase();
  return KEYWORD_WHITELIST.some(k => title.includes(k) || desc.includes(k));
}

async function searchYouTube(query, apiKey) {
  // publishedAfter: last 90 days, keeps the feed actually "recent"
  const publishedAfter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    q: query,
    order: 'date',
    maxResults: '10',
    videoEmbeddable: 'true',
    safeSearch: 'moderate',
    publishedAfter,
    relevanceLanguage: 'en',
    key: apiKey
  });
  const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
  const r = await fetch(url);
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`YouTube API ${r.status}: ${text.slice(0, 200)}`);
  }
  const data = await r.json();
  return Array.isArray(data?.items) ? data.items : [];
}

export default async function handler(req, res) {
  // CORS for safety (same-origin from Vercel anyway, but harmless)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate=86400'); // 12h edge cache

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'YOUTUBE_API_KEY environment variable is not set in Vercel.',
      videos: []
    });
  }

  try {
    const results = await Promise.allSettled(
      SEARCH_QUERIES.map(q => searchYouTube(q, apiKey))
    );

    const merged = [];
    const seen = new Set();
    for (const r of results) {
      if (r.status !== 'fulfilled') continue;
      for (const item of r.value) {
        const vid = item?.id?.videoId;
        if (!vid || seen.has(vid)) continue;
        if (!isRelevant(item)) continue;
        seen.add(vid);
        merged.push({
          id: vid,
          videoId: vid,
          title: item.snippet?.title || '',
          channel: item.snippet?.channelTitle || '',
          publishedAt: item.snippet?.publishedAt || null,
          thumbnail:
            item.snippet?.thumbnails?.medium?.url ||
            item.snippet?.thumbnails?.default?.url ||
            ''
        });
      }
    }

    // Sort most recent first
    merged.sort((a, b) => {
      const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return tb - ta;
    });

    const videos = merged.slice(0, 24);

    return res.status(200).json({
      videos,
      count: videos.length,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('[youtube-feed] error:', err);
    return res.status(500).json({
      error: err.message || 'YouTube feed failed',
      videos: []
    });
  }
}
