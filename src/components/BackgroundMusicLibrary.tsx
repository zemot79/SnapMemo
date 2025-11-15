import { useState, useEffect, useRef } from "react";
import { searchMusic, downloadTrack, MusicTrack } from "@/lib/musicApi";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Search, Play, Pause, Download, Music2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BackgroundMusicLibraryProps {
  onTrackSelected: (file: File) => void;
}

const moods = [
  { label: "All", value: "" },
  { label: "Upbeat", value: "upbeat happy energetic" },
  { label: "Calm", value: "calm relaxing peaceful" },
  { label: "Cinematic", value: "cinematic epic dramatic" },
  { label: "Corporate", value: "corporate business professional" },
  { label: "Electronic", value: "electronic dance edm" },
  { label: "Acoustic", value: "acoustic guitar folk" },
];

export const BackgroundMusicLibrary = ({ onTrackSelected }: BackgroundMusicLibraryProps) => {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [downloadingTrackId, setDownloadingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const apiKeyConfigured = !!import.meta.env.VITE_PIXABAY_API_KEY;

  useEffect(() => {
    if (apiKeyConfigured) {
      loadTracks();
    }
  }, [selectedMood, apiKeyConfigured]);

  const loadTracks = async () => {
    setLoading(true);
    try {
      const query = searchQuery || selectedMood;
      const result = await searchMusic(query);
      setTracks(result.tracks);
    } catch (error) {
      console.error("Error loading tracks:", error);
      toast.error("Failed to load music tracks");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadTracks();
  };

  const togglePlayPause = (track: MusicTrack) => {
    if (playingTrackId === track.id) {
      audioRef.current?.pause();
      setPlayingTrackId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(track.previewUrl);
      audioRef.current.play();
      audioRef.current.onended = () => setPlayingTrackId(null);
      setPlayingTrackId(track.id);
    }
  };

  const handleDownloadAndUse = async (track: MusicTrack) => {
    setDownloadingTrackId(track.id);
    try {
      const file = await downloadTrack(track.downloadUrl, `${track.name}.mp3`);
      onTrackSelected(file);
      toast.success("Music track added!");
    } catch (error) {
      console.error("Error downloading track:", error);
      toast.error("Failed to download track");
    } finally {
      setDownloadingTrackId(null);
    }
  };

  if (!apiKeyConfigured) {
    return (
      <Card className="p-8 text-center bg-card/50">
        <Music2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-semibold text-lg mb-2">API Key Required</h3>
        <p className="text-sm text-muted-foreground mb-4">
          To use the free music library, you need to configure a Pixabay API key.
        </p>
        <p className="text-xs text-muted-foreground">
          Get a free API key from{" "}
          <a
            href="https://pixabay.com/api/docs/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            pixabay.com
          </a>{" "}
          and add it as VITE_PIXABAY_API_KEY in your environment variables.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Search for music..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="icon">
          <Search className="w-4 h-4" />
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {moods.map((mood) => (
          <Button
            key={mood.value}
            variant={selectedMood === mood.value ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedMood(mood.value);
              setSearchQuery("");
            }}
          >
            {mood.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : tracks.length === 0 ? (
        <Card className="p-8 text-center bg-card/50">
          <Music2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No tracks found</p>
          <p className="text-sm text-muted-foreground mt-1">Try a different search or mood</p>
        </Card>
      ) : (
        <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2">
          {tracks.map((track) => (
            <Card key={track.id} className="p-4 bg-card/50">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => togglePlayPause(track)}
                    className="flex-shrink-0"
                  >
                    {playingTrackId === track.id ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{track.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, "0")}
                      {track.author && ` • ${track.author}`}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleDownloadAndUse(track)}
                  disabled={downloadingTrackId === track.id}
                >
                  {downloadingTrackId === track.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-1" />
                      Use
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
