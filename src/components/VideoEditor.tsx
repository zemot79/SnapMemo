import { useState, useEffect } from "react";
import { MediaItem } from "./Timeline";
import { X, Scissors, Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface VideoEditorProps {
  videos: MediaItem[];
  onRemove: (id: string) => void;
  onClipsChange: (
    id: string,
    clips: { id: string; startTime: number; endTime: number }[]
  ) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
}

export const VideoEditor = ({
  videos,
  onRemove,
  onClipsChange,
  onReorder,
}: VideoEditorProps) => {
  const [videoDurations, setVideoDurations] = useState<Record<string, number>>(
    {}
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // -------------------------------------------------------
  //  DRAG & DROP VIDEO REORDER
  // -------------------------------------------------------
  const handleDragStart = (index: number) => setDraggedIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex && onReorder) {
      onReorder(draggedIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // -------------------------------------------------------
  //  LOAD VIDEO DURATIONS FROM FILE
  // -------------------------------------------------------
  useEffect(() => {
    videos.forEach((video) => {
      // ha már van durationünk, nem számoljuk újra
      if (videoDurations[video.id]) return;

      // ha van file, abból próbáljuk kiolvasni
      if (video.file) {
        const el = document.createElement("video");
        el.preload = "metadata";
        el.src = URL.createObjectURL(video.file);

        el.onloadedmetadata = () => {
          const duration =
            Math.floor(el.duration) || video.duration || 30;
          setVideoDurations((prev) => ({
            ...prev,
            [video.id]: duration,
          }));
          URL.revokeObjectURL(el.src);
        };

        el.onerror = () => {
          setVideoDurations((prev) => ({
            ...prev,
            [video.id]: video.duration || 30,
          }));
          URL.revokeObjectURL(el.src);
        };
      } else if (video.duration) {
        // ha valamiért nincs file, de van duration, azt használjuk
        setVideoDurations((prev) => ({
          ...prev,
          [video.id]: video.duration,
        }));
      }
    });
  }, [videos, videoDurations]);

  // -------------------------------------------------------
  //  SEGMENT HANDLING
  // -------------------------------------------------------
  const addClip = (videoId: string) => {
    const video = videos.find((v) => v.id === videoId);
    const duration =
      videoDurations[videoId] || video?.duration || 30;

    if (!video || duration === 0) return;

    const newClip = {
      id: Math.random().toString(36).substring(2, 10),
      startTime: 0,
      endTime: duration,
    };

    onClipsChange(videoId, [...(video.clips || []), newClip]);
  };

  const removeClip = (videoId: string, clipId: string) => {
    const video = videos.find((v) => v.id === videoId);
    if (!video) return;

    onClipsChange(
      videoId,
      (video.clips || []).filter((c) => c.id !== clipId)
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

    const maxDuration =
      videoDurations[videoId] || video.duration || 30;

    const updated = video.clips.map((clip) => {
      if (clip.id !== clipId) return clip;

      if (field === "startTime") {
        const start = Math.max(0, Math.min(value, clip.endTime - 1));
        return { ...clip, startTime: start };
      }

      const end = Math.min(
        maxDuration,
        Math.max(value, clip.startTime + 1)
      );
      return { ...clip, endTime: end };
    });

    onClipsChange(videoId, updated);
  };

  // -------------------------------------------------------
  //  NO VIDEOS
  // -------------------------------------------------------
  if (videos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No videos added yet</p>
      </div>
    );
  }

  // -------------------------------------------------------
  //  UI RENDER
  // -------------------------------------------------------
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
      {videos.map((video, index) => {
        const duration =
          videoDurations[video.id] || video.duration || 0;
        const clips = video.clips || [];
        const total = clips.reduce(
          (acc, c) => acc + (c.endTime - c.startTime),
          0
        );

        return (
          <Card
            key={video.id}
            draggable={!!onReorder}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`overflow-hidden group relative transition-all ${
              draggedIndex === index
                ? "opacity-50 scale-95"
                : dragOverIndex === index
                ? "ring-2 ring-primary"
                : ""
            }`}
          >
            {/* DRAG HANDLE */}
            {onReorder && (
              <div className="absolute top-2 left-2 z-10 p-1 bg-background/80 rounded cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              </div>
            )}

            {/* VIDEO PREVIEW */}
            <div className="relative aspect-[16/12] bg-muted">
              {(video.thumbnail || video.file) && (
                <video
                  src={
                    video.thumbnail ||
                    (video.file
                      ? URL.createObjectURL(video.file)
                      : undefined)
                  }
                  className="w-full h-full object-cover"
                  controls
                  preload="metadata"
                />
              )}

              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemove(video.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* CONTENT */}
            <div className="p-4 bg-card space-y-4">
              <div>
                <p className="text-sm font-medium truncate">
                  {video.file?.name}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Scissors className="w-3 h-3" />
                  {total.toFixed(1)} sec ({clips.length} segments)
                </p>
              </div>

              {/* TIMELINE VISUAL */}
              <div className="relative h-8 bg-secondary rounded overflow-hidden">
                {clips.map((clip) => {
                  const left = (clip.startTime / duration) * 100;
                  const width =
                    ((clip.endTime - clip.startTime) / duration) * 100;
                  return (
                    <div
                      key={clip.id}
                      className="absolute h-full bg-primary/60 border-x border-primary"
                      style={{ left: `${left}%`, width: `${width}%` }}
                    />
                  );
                })}
              </div>

              {/* SEGMENTS */}
              <div className="space-y-3">
                {clips.map((clip, idx) => (
                  <div
                    key={clip.id}
                    className="flex items-center gap-2 p-2 bg-secondary/40 rounded-lg"
                  >
                    <span className="text-xs min-w-[20px] text-muted-foreground">
                      #{idx + 1}
                    </span>

                    <div className="flex-1 space-y-2">
                      {/* SLIDERS */}
                      <div className="space-y-1">
                        <Label className="text-xs">Segment (sec)</Label>
                        <div className="flex flex-col gap-1">
                          <input
                            type="range"
                            min={0}
                            max={duration}
                            value={clip.startTime}
                            onChange={(e) =>
                              updateClip(
                                video.id,
                                clip.id,
                                "startTime",
                                Number(e.target.value)
                              )
                            }
                            className="w-full"
                          />
                          <input
                            type="range"
                            min={0}
                            max={duration}
                            value={clip.endTime}
                            onChange={(e) =>
                              updateClip(
                                video.id,
                                clip.id,
                                "endTime",
                                Number(e.target.value)
                              )
                            }
                            className="w-full -mt-1"
                          />
                        </div>
                      </div>

                      {/* NUMERIC INPUTS */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Start</Label>
                          <Input
                            type="number"
                            value={clip.startTime}
                            min={0}
                            max={clip.endTime - 1}
                            onChange={(e) =>
                              updateClip(
                                video.id,
                                clip.id,
                                "startTime",
                                Number(e.target.value)
                              )
                            }
                            className="h-8"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">End</Label>
                          <Input
                            type="number"
                            value={clip.endTime}
                            min={clip.startTime + 1}
                            max={duration}
                            onChange={(e) =>
                              updateClip(
                                video.id,
                                clip.id,
                                "endTime",
                                Number(e.target.value)
                              )
                            }
                            className="h-8"
                          />
                        </div>
                      </div>
                    </div>

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

              {/* ADD SEGMENT BUTTON */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => addClip(video.id)}
                className="w-full gap-2"
              >
                <Plus className="w-4 h-4" />
                Add segment
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
