import { useState, useEffect } from "react";
import { MediaItem } from "./Timeline";
import { X, Scissors, Play, Plus, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface VideoEditorProps {
  videos: MediaItem[];
  onRemove: (id: string) => void;
  onClipsChange: (id: string, clips: { id: string; startTime: number; endTime: number }[]) => void;
}

export const VideoEditor = ({
  videos,
  onRemove,
  onClipsChange,
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

  const addClip = (videoId: string) => {
    const video = videos.find((v) => v.id === videoId);
    const duration = videoDurations[videoId] || 0;
    if (!video || duration === 0) return;

    const clips = video.clips || [];
    const newClip = {
      id: Math.random().toString(36).substr(2, 9),
      startTime: 0,
      endTime: Math.min(10, duration),
    };
    onClipsChange(videoId, [...clips, newClip]);
  };

  const removeClip = (videoId: string, clipId: string) => {
    const video = videos.find((v) => v.id === videoId);
    if (!video || !video.clips) return;
    
    onClipsChange(
      videoId,
      video.clips.filter((c) => c.id !== clipId)
    );
  };

  const updateClip = (
    videoId: string,
    clipId: string,
    field: "startTime" | "endTime",
    value: number
  ) => {
    const video = videos.find((v) => v.id === videoId);
    if (!video || !video.clips) return;

    const maxDuration = videoDurations[videoId] || 0;
    const clips = video.clips.map((clip) => {
      if (clip.id !== clipId) return clip;

      if (field === "startTime") {
        const startTime = Math.max(0, Math.min(value, clip.endTime - 1));
        return { ...clip, startTime };
      } else {
        const endTime = Math.min(maxDuration, Math.max(value, clip.startTime + 1));
        return { ...clip, endTime };
      }
    });

    onClipsChange(videoId, clips);
  };

  if (videos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Még nincs videó hozzáadva</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {videos.map((video) => {
        const duration = videoDurations[video.id] || 0;
        const clips = video.clips || [];
        const totalClipDuration = clips.reduce(
          (acc, clip) => acc + (clip.endTime - clip.startTime),
          0
        );

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
                  Összes vágás: {totalClipDuration.toFixed(1)} mp ({clips.length} szakasz)
                </p>
              </div>

              {duration > 0 && (
                <div className="space-y-3">
                  {/* Timeline visualization */}
                  <div className="relative h-8 bg-secondary rounded overflow-hidden">
                    {clips.map((clip) => {
                      const left = (clip.startTime / duration) * 100;
                      const width = ((clip.endTime - clip.startTime) / duration) * 100;
                      return (
                        <div
                          key={clip.id}
                          className="absolute h-full bg-primary/60 border-x border-primary"
                          style={{ left: `${left}%`, width: `${width}%` }}
                        />
                      );
                    })}
                  </div>

                  {/* Clip inputs */}
                  <div className="space-y-2">
                    {clips.map((clip, index) => (
                      <div
                        key={clip.id}
                        className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg"
                      >
                        <span className="text-xs font-medium text-muted-foreground min-w-[20px]">
                          #{index + 1}
                        </span>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Kezdés (mp)</Label>
                            <Input
                              type="number"
                              value={clip.startTime}
                              onChange={(e) =>
                                updateClip(
                                  video.id,
                                  clip.id,
                                  "startTime",
                                  Number(e.target.value)
                                )
                              }
                              min="0"
                              max={clip.endTime - 1}
                              className="h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Befejezés (mp)</Label>
                            <Input
                              type="number"
                              value={clip.endTime}
                              onChange={(e) =>
                                updateClip(
                                  video.id,
                                  clip.id,
                                  "endTime",
                                  Number(e.target.value)
                                )
                              }
                              min={clip.startTime + 1}
                              max={duration}
                              className="h-8"
                            />
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground min-w-[40px]">
                          {(clip.endTime - clip.startTime).toFixed(1)}mp
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeClip(video.id, clip.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Add clip button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addClip(video.id)}
                    className="w-full gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Új szakasz hozzáadása
                  </Button>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
