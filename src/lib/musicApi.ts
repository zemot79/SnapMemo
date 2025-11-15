export interface MusicTrack {
  id: string;
  name: string;
  duration: number;
  previewUrl: string;
  downloadUrl: string;
  author?: string;
  tags?: string[];
}

const PIXABAY_API_KEY = import.meta.env.VITE_PIXABAY_API_KEY || "";

export const searchMusic = async (query: string = "", page: number = 1): Promise<{ tracks: MusicTrack[]; total: number }> => {
  try {
    if (!PIXABAY_API_KEY) {
      console.warn("Pixabay API key not configured");
      return { tracks: [], total: 0 };
    }

    const url = `https://pixabay.com/api/music/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&per_page=20&page=${page}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    const tracks: MusicTrack[] = (data.hits || []).map((hit: any) => ({
      id: hit.id.toString(),
      name: hit.tags,
      duration: hit.duration,
      previewUrl: hit.previewURL,
      downloadUrl: hit.url,
      author: hit.user,
      tags: hit.tags?.split(", ") || [],
    }));

    return {
      tracks,
      total: data.totalHits || 0,
    };
  } catch (error) {
    console.error("Error searching music:", error);
    return { tracks: [], total: 0 };
  }
};

export const getMusicByMood = async (mood: string): Promise<MusicTrack[]> => {
  const result = await searchMusic(mood, 1);
  return result.tracks;
};

export const downloadTrack = async (url: string, filename: string): Promise<File> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
};
