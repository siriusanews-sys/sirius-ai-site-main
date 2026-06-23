import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Geocode a free-text location string to { latitude, longitude }
 * using the OpenStreetMap Nominatim public API (no key required).
 * Returns null on failure so callers can fall back gracefully.
 */
export async function geocodeLocation(query) {
  if (!query || typeof query !== "string" || !query.trim()) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query.trim())}`;
    const res = await fetch(url, {
      headers: {
        // Nominatim asks for a descriptive UA / Referer for public usage
        "Accept": "application/json"
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const first = data[0];
    const lat = parseFloat(first.lat);
    const lon = parseFloat(first.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
    return { latitude: lat, longitude: lon };
  } catch (e) {
    console.warn("[geocodeLocation] failed:", e?.message);
    return null;
  }
}
