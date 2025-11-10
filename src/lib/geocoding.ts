// Simple geocoding service using Nominatim (free, no API key needed)
export interface Coordinates {
  lat: number;
  lon: number;
  displayName: string;
}

export const geocodeLocation = async (location: string): Promise<Coordinates | null> => {
  if (!location || location.trim() === "") {
    return null;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
      {
        headers: {
          'User-Agent': 'VideoMixerStudio/1.0'
        }
      }
    );

    if (!response.ok) {
      console.error('Geocoding failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};
