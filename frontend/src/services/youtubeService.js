/**
 * youtubeService.js
 *
 * Thin client wrappers around the `/api/youtube-feed` Vercel serverless
 * function so the YouTube Data API key stays hidden on the server.
 *
 * Exports:
 *   - fetchUFOVideos(limit)              → latest UAP/UFO videos
 *   - fetchDisclosureNewsVideos(limit)   → latest disclosure-themed videos
 *
 * Both functions hit the same `/api/youtube-feed` endpoint (which already
 * runs UAP/UFO-focused queries server-side) and just slice the response
 * to the requested limit. They return an array of video objects with both
 * `videoId` and `video_id` set so any consumer of either shape works.
 */
import axios from "axios";

const FEED_ENDPOINT = "/api/youtube-feed";
const DEFAULT_LIMIT = 12;

async function fetchFeed(query = "", limit = DEFAULT_LIMIT) {
  const url = query ? `${FEED_ENDPOINT}?q=${encodeURIComponent(query)}` : FEED_ENDPOINT;
  const res = await axios.get(url, { timeout: 20000 });
  const items = Array.isArray(res.data?.videos) ? res.data.videos : [];
  return items.slice(0, limit).map((v, i) => ({
    id: v.id || v.videoId || i,
    videoId: v.videoId || v.id,
    video_id: v.videoId || v.id, // legacy snake_case consumers
    title: v.title || "Untitled",
    channel: v.channel || "",
    publishedAt: v.publishedAt || null,
    thumbnail: v.thumbnail || ""
  }));
}

export async function fetchUFOVideos(limit = DEFAULT_LIMIT) {
  try {
    return await fetchFeed("UAP", limit);
  } catch (e) {
    console.warn("[youtubeService] fetchUFOVideos failed:", e?.message);
    return [];
  }
}

export async function fetchDisclosureNewsVideos(limit = DEFAULT_LIMIT) {
  try {
    return await fetchFeed("UAP disclosure", limit);
  } catch (e) {
    console.warn("[youtubeService] fetchDisclosureNewsVideos failed:", e?.message);
    return [];
  }
}

const youtubeService = { fetchUFOVideos, fetchDisclosureNewsVideos };
export default youtubeService;
