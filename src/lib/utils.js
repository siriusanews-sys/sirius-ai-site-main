import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Common location coordinates database (fast, no external API)
const COMMON_LOCATIONS = {
  'crete': { lat: 35.3387, lng: 25.1327 },
  'cyprus': { lat: 34.9249, lng: 33.4299 },
  'athens': { lat: 37.9838, lng: 23.7275 },
  'athens, greece': { lat: 37.9838, lng: 23.7275 },
  'london': { lat: 51.5074, lng: -0.1278 },
  'london, uk': { lat: 51.5074, lng: -0.1278 },
  'new york': { lat: 40.7128, lng: -74.0060 },
  'new york, usa': { lat: 40.7128, lng: -74.0060 },
  'los angeles': { lat: 34.0522, lng: -118.2437 },
  'los angeles, usa': { lat: 34.0522, lng: -118.2437 },
  'paris': { lat: 48.8566, lng: 2.3522 },
  'paris, france': { lat: 48.8566, lng: 2.3522 },
  'tokyo': { lat: 35.6762, lng: 139.6503 },
  'tokyo, japan': { lat: 35.6762, lng: 139.6503 },
  'sydney': { lat: -33.8688, lng: 151.2093 },
  'sydney, australia': { lat: -33.8688, lng: 151.2093 },
  'roswell': { lat: 33.3943, lng: -104.5230 },
  'roswell, new mexico': { lat: 33.3943, lng: -104.5230 },
  'area 51': { lat: 37.2353, lng: -115.8067 },
  'area 51, nevada': { lat: 37.2353, lng: -115.8067 },
  'phoenix': { lat: 33.4484, lng: -112.0740 },
  'phoenix, arizona': { lat: 33.4484, lng: -112.0740 },
};

/**
 * Geocode a location string to latitude and longitude
 * First tries predefined common locations, then falls back to Nominatim API
 */
export async function geocodeLocation(locationString) {
  if (!locationString || locationString.trim() === '') return null;
  
  const normalized = locationString.trim().toLowerCase();
  
  // Check predefined locations first (fast, no API)
  for (const [key, coords] of Object.entries(COMMON_LOCATIONS)) {
    if (normalized === key || normalized.includes(key) || key.includes(normalized)) {
      return { latitude: coords.lat, longitude: coords.lng };
    }
  }
  
  // Fallback to Nominatim API (OpenStreetMap)
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationString)}&format=json&limit=1`,
      { timeout: 15000 }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        };
      }
    }
  } catch (error) {
    console.warn('[Geocoding] Nominatim API failed:', error.message);
  }
  
  return null;
}
