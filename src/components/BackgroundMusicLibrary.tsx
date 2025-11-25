import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Music, Play, Check } from "lucide-react";

interface BackgroundMusicLibraryProps {
  onTrackSelected: (file: File) => void;
}

type LibraryTrack = {
  id: string;
  title: string;
  src: string;
  duration: string;
};

const TRACKS: LibraryTrack[] = [
  {
    id: "track1",
    title: "Soft Ambient",
    src: "/music/soft-ambient.mp3",
    duration: "2:12",
  },
  {
    id: "track2",
    title: "Cinematic Piano",
    src: "/music/cinematic-piano.mp3",
    duration: "1:56",
  },
  {
    id: "track3",
    title: "Upbeat Corporate",
    src: "/music/upbeat-corporate.mp3",
    duration: "2:34",
  },
  {
    id: "track4",
    title: "LoFi Chill",
    src: "/music/lofi-chill.mp3",
    duration: "2:00",
  },
];

export const BackgroundMusicLibrary = ({
  onTrackSelected,
}: BackgroundMusicLibraryProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = async (track: LibraryTrack) => {
    setSelectedId(track.id);

    try {
      const response = await fetch(track.src);
      const blob = await response.blob();

      const file = new File([blob], `${track.title}.mp3`, {
        type: "audio/mpeg",
      });

      onTrackSelected(file);
    } catch (error) {
      console.error("Music load error:", error);
    }
  };

  return (
    <div className="space-y-4">
      {TRACKS.map((track) => (
        <Card
          key={track.id}
          className="p-4 bg-card/50 hover:bg-card/70 transition-colors"
        >
          <div className="flex items-center justify-between">
            {/* LEFT */}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{track.title}</p>
                <p className="text-xs text-muted-foreground">
                  {track.duration}
                </p>
              </div>
            </div>

            {/* RIGHT */}
            <Button
              size="sm"
              variant={selectedId === track.id ? "default" : "outline"}
              className="flex items-center gap-2"
              onClick={() => handleSelect(track)}
            >
              {selectedId === track.id ? (
                <>
                  <Check className="w-4 h-4" /> Selected
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Add
                </>
              )}
            </Button>
          </div>
        </Card>
      ))}

      <p className="text-xs text-muted-foreground text-center mt-4">
        More free tracks coming soon.
      </p>
    </div>
  );
};
