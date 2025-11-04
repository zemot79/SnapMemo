import { useState, useEffect } from "react";
import { MediaItem } from "./Timeline";
import { X, Scissors, Play } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface VideoEditorProps {
  videos: MediaItem[];
  onRemove: (id: string) => void;
  onClipChange: (id: string, startTime: number, endTime: number) => void;
}

export const VideoEditor = ({
  videos,
  onRemove,
  onClipChange,
}: VideoEditorProps) => {
  const [videoDurations, setVideoDurations] = useState<Record<string, number>>({});

  useEffect(() => {
    videos.forEach((video) => {
      if (!videoDurations[video.id]) {
        const videoElement = document.createElement("video");
        videoElement.src = URL.createObjectURL(video.file);
        videoElement.onloadedmetadata = () => {
          setVideoDurations((prev) => ({
            ...prev,
            [video.id]: Math.floor(videoElement.duration),
          }));
          URL.revokeObjectURL(videoElement.src);
        };
      }
    });
  }, [videos]);

  const handleStartTimeChange = (id: string, value: string) => {
    const startTime = Math.max(0, Number(value));
    const video = videos.find((v) => v.id === id);
    const endTime = video?.endTime || videoDurations[id] || 0;
    
    if (startTime < endTime) {
      onClipChange(id, startTime, endTime);
    }
  };

  const handleEndTimeChange = (id: string, value: string) => {
    const video = videos.find((v) => v.id === id);
    const maxDuration = videoDurations[id] || 0;
    const endTime = Math.min(maxDuration, Number(value));
    const startTime = video?.startTime || 0;
    
    if (endTime > startTime) {
      onClipChange(id, startTime, endTime);
    }
  };

  if (videos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Még nincs videó hozzáadva</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {videos.map((video) => {
        const duration = videoDurations[video.id] || 0;
        const startTime = video.startTime || 0;
        const endTime = video.endTime || duration;
        const clipDuration = endTime - startTime;

        return (
          <Card key={video.id} className="overflow-hidden group relative">
            <div className="relative aspect-video bg-muted">
              {video.thumbnail && (
                <video
                  src={video.thumbnail}
                  className="w-full h-full object-cover"
                  muted
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemove(video.id)}
              >
                <X className="w-4 h-4" />
              </Button>
              <div className="absolute bottom-2 left-2 right-2">
                <div className="flex items-center gap-2 text-white text-sm">
                  <Play className="w-4 h-4" />
                  <span className="font-medium">
                    {duration > 0 ? `${duration} mp` : "Betöltés..."}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-card space-y-4">
              <div>
                <p className="text-sm font-medium truncate mb-1">
                  {video.file.name}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Scissors className="w-3 h-3" />
                  Vágás hossza: {clipDuration} mp
                </p>
              </div>
              
              {duration > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`start-${video.id}`} className="text-xs">
                      Kezdés (mp)
                    </Label>
                    <Input
                      id={`start-${video.id}`}
                      type="number"
                      value={startTime}
                      onChange={(e) => handleStartTimeChange(video.id, e.target.value)}
                      min="0"
                      max={endTime - 1}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`end-${video.id}`} className="text-xs">
                      Befejezés (mp)
                    </Label>
                    <Input
                      id={`end-${video.id}`}
                      type="number"
                      value={endTime}
                      onChange={(e) => handleEndTimeChange(video.id, e.target.value)}
                      min={startTime + 1}
                      max={duration}
                      className="h-9"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
