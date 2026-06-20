# SIRIUS AI - UAP / UFO Event Network

## Original problem statement (last iteration)
User's bottom "Live Media" video bar wasn't behaving as a real live feed: it used hardcoded videos and clicking didn't play anything inline. Requirements:
- Live YouTube feed limited to UAP / UFO mysteries topics
- Auto-refresh every 12 hours with the most recent uploads
- Click on a video → plays INLINE inside the existing footer space (no modal popup)
- Keep the API key hidden via a serverless function
- Do NOT touch the SIRIUS AI Gemini chat agent or any other layout

## Architecture
- Frontend: React (CRA) deployed via Vercel from GitHub
- Vercel serverless functions live in `/api/*.js`
- SIRIUS AI Gemini chat: `/api/sirius-final-v1` (untouched)
- Live feed: NEW `/api/youtube-feed.js` (this iteration)

## Implemented in this iteration
- New `/app/api/youtube-feed.js` serverless function:
  - Reads `YOUTUBE_API_KEY` from Vercel env (server-side, key hidden)
  - Runs 8 UAP/UFO search queries in parallel, ordered by `date`
  - Dedupes by videoId, keyword whitelist filter, returns up to 24 videos
  - Edge-cached for 12h (`s-maxage=43200, stale-while-revalidate=86400`)
- Rewrote `LiveMediaFooter` in `/app/frontend/src/App.js`:
  - Fetches from `/api/youtube-feed` on mount
  - 12-hour `setInterval` refresh + localStorage cache (`sirius_live_feed_cache_v1`)
  - Inline iframe player that appears IN the footer (no modal)
  - "Now Playing" highlight on active thumbnail + close button
  - Refresh button + "Updated HH:MM" timestamp
  - Graceful fallback to curated `VIDEO_DATA` if API fails

## Deployment notes for user
1. Add env var `YOUTUBE_API_KEY` in Vercel → Project Settings → Environment Variables
2. Use Emergent's **"Save to GitHub"** button to push these changes → Vercel auto-redeploys

## Known untouched issues (per user's explicit "do not change") 
These references appear in App.js but were not modified per user instruction.
They are assumed to be resolved in user's GitHub branch:
- `satellites` / `setSatellites` state
- `setVideos` / `STATIC_VIDEOS` in `fetchVideos`
- `FALLBACK_NEOS` constant
- `getSessionId()` helper
- `./services/youtubeService` module
- `./lib/utils` → `geocodeLocation` export

## Next action items / backlog
- (P1) Add same `YOUTUBE_API_KEY`-backed function for the chat's VIDEOS_TRIGGERED grid to make it live too
- (P2) Add channel-source filter UI (NewsNation / JRE / Lex Fridman etc.)
- (P3) Persist last-played video across sessions
