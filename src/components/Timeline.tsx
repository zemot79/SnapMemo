import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GripVertical,
  Trash2,
  Type as TypeIcon,
  Image as ImageIcon,
  Video as VideoIcon,
  MapPin,
} from "lucide-react";

// ---- TÍPUSOK -------------------------------------------------------------

export type MediaItemType = "image" | "video" | "title" | "location";

export interface TextOverlay {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  position?: "top" | "center" | "bottom";
  style?: "title" | "subtitle" | "lowerThird";
}

export type KenBurnsEffect = "zoomIn" | "zoomOut" | "panLeft" | "panRight";

export interface KenBurnsSettings {
  enabled: boolean;
  effect: KenBurnsEffect;
}

export interface MediaItem {
  id: string;
  type: MediaItemType;
  file?: File;
  url?: string;
  thumbnail?: string;
  duration?: number;
  // videóknál – a VideoEditor-ban kezelt szegmensek
  clips?: { id: string; startTime: number; endTime: number }[];
  // képeknél – Ken Burns
  kenBurns?: KenBurnsSettings;
  // text overlayk
  textOverlays?: TextOverlay[];
  // egyéb metainfók
  title?: string;
  description?: string;
}

interface TimelineProps {
  items: MediaItem[];
  onRemove: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onDurationChange: (id: string, duration: number) => void;
  onKenBurnsChange?: (id: string, kenBurns: KenBurnsSettings) => void;
  onTextOverlayClick?: (id: string) => void;
  location?: string;
}

// ---- SEGÉD: drag & drop --------------------------------------------------

const clampIndex = (idx: number, length: number) =>
  Math.max(0, Math.min(length - 1, idx));

// ---- FŐ KOMPONENS --------------------------------------------------------

export const Timeline: React.FC<TimelineProps> = ({
  items,
  onRemove,
  onReorder,
  onDurationChange,
  onKenBurnsChange,
  onTextOverlayClick,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // arányos szélességhez max. hossz
  const { maxDuration, normalizedDurations } = useMemo(() => {
    if (!items.length) {
      return { maxDuration: 1, normalizedDurations: [] as number[] };
    }
    const durations = items.map((item) => {
      if (item.duration && item.duration > 0) return item.duration;
      // ha nincs explicit duration:
      if (item.type === "image") return 3; // default image
      if (item.type === "video") {
        // ha a videó szegmensekből áll, azok összege
        if (item.clips && item.clips.length > 0) {
          return item.clips.reduce(
            (sum, c) => sum + (c.endTime - c.startTime),
            0
          );
        }
        return 5; // videó default fallback
      }
      return 2;
    });

    const maxDur = Math.max(...durations, 1);
    const normalized = durations.map((d) => d / maxDur);
    return { maxDuration: maxDur, normalizedDurations: normalized };
  }, [items]);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === toIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const from = clampIndex(draggedIndex, items.length);
    const to = clampIndex(toIndex, items.length);
    if (from !== to) {
      onReorder(from, to);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDurationInputChange = (item: MediaItem, value: number) => {
    if (value <= 0) return;
    onDurationChange(item.id, value);
  };

  if (!items.length) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No items in the timeline yet. Add images or videos first.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isVideo = item.type === "video";
        const isImage = item.type === "image";
        const baseDuration =
          item.duration && item.duration > 0
            ? item.duration
            : isImage
            ? 3
            : isVideo
            ? 5
            : 2;

        const normalized =
          normalizedDurations[index] && normalizedDurations[index] > 0
            ? normalizedDurations[index]
            : 0.2;

        // min és max vizuális szélesség
        const widthPercent = 20 + normalized * 80; // 20%–100%

        const hasTextOverlay = item.textOverlays && item.textOverlays.length > 0;

        return (
          <React.Fragment key={item.id}>
            <Card
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={[
                "group border border-border/80 bg-card/80 backdrop-blur-sm transition-all cursor-grab active:cursor-grabbing",
                draggedIndex === index ? "opacity-50 scale-[0.98]" : "",
                dragOverIndex === index ? "ring-2 ring-primary/70" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="flex items-start gap-3 p-3">
                {/* Drag handle */}
                <div className="pt-2">
                  <div className="p-1 rounded-md bg-muted flex items-center justify-center">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                {/* Thumbnail + alapinfók */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-20 h-14 rounded-md overflow-hidden bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      {isVideo ? (
                        item.thumbnail || item.url ? (
                          <video
                            src={item.thumbnail || item.url}
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                          />
                        ) : (
                          <VideoIcon className="w-6 h-6" />
                        )
                      ) : isImage ? (
                        item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt={item.file?.name || "Image"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6" />
                        )
                      ) : item.type === "location" ? (
                        <MapPin className="w-6 h-6" />
                      ) : (
                        <TypeIcon className="w-6 h-6" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">
                            {item.type === "video"
                              ? "Video"
                              : item.type === "image"
                              ? "Image"
                              : item.type === "title"
                              ? "Title card"
                              : "Location"}
                          </p>
                          <p className="text-sm font-medium truncate">
                            {item.title ||
                              item.file?.name ||
                              item.url ||
                              `Item #${index + 1}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Text overlay jelzés + gomb */}
                          {onTextOverlayClick && (
                            <Button
                              type="button"
                              variant={hasTextOverlay ? "default" : "outline"}
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => onTextOverlayClick(item.id)}
                            >
                              <TypeIcon
                                className="w-3 h-3"
                                aria-hidden="true"
                              />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => onRemove(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Duration bar – arányos timeline blokk */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-[11px] text-muted-foreground">
                            Clip length
                          </Label>
                          <span className="text-[11px] tabular-nums text-muted-foreground">
                            {baseDuration.toFixed(1)}s
                          </span>
                        </div>
                        <div className="relative h-3 rounded-full bg-secondary/70 overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-primary/70"
                            style={{ width: `${widthPercent}%` }}
                          >
                            {/* bal/jobb "handle" csak vizuálisan */}
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/90" />
                            <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-primary/90" />
                          </div>
                        </div>
                      </div>

                      {/* Duration szerkesztés – képeknél állítható, videóknál csak info */}
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        {isImage ? (
                          <>
                            <div className="flex-1 min-w-[140px]">
                              <input
                                type="range"
                                min={1}
                                max={15}
                                step={0.5}
                                value={baseDuration}
                                onChange={(e) =>
                                  handleDurationInputChange(
                                    item,
                                    Number(e.target.value)
                                  )
                                }
                                className="w-full"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                className="h-7 w-16 text-xs"
                                value={baseDuration}
                                min={1}
                                max={60}
                                step={0.5}
                                onChange={(e) =>
                                  handleDurationInputChange(
                                    item,
                                    Number(e.target.value)
                                  )
                                }
                              />
                              <span className="text-[11px] text-muted-foreground">
                                sec
                              </span>
                            </div>
                          </>
                        ) : isVideo ? (
                          <p className="text-[11px] text-muted-foreground">
                            Video clip length is controlled in the{" "}
                            <span className="font-medium">Videos</span> step.
                          </p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground">
                            Duration is derived from content.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Transition "pill" információ – itt most csak info,
                a tényleges randomizálás globálisan, a jobb oldali panelen történik */}
            {index < items.length - 1 && (
              <div className="flex items-center justify-center py-1">
                <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-border/70 bg-muted/60 px-3 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                  <span className="text-[11px] text-muted-foreground">
                    Transition between clips (random from selected set)
                  </span>
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
