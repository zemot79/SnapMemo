import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  GripVertical,
  ImageIcon,
  VideoIcon,
  Type,
  MapPin,
  Trash2,
} from "lucide-react";

export interface MediaItem {
  id: string;
  type: "image" | "video" | "title" | "location";
  file?: File;
  thumbnail?: string;
  url?: string;
  duration?: number;
  videoLength?: number;
  location?: string;
}

interface TimelineProps {
  items: MediaItem[];
  onRemove: (id: string) => void;
  onReorder: (from: number, to: number) => void;
  onDurationChange: (id: string, seconds: number) => void;
  onTextOverlayClick?: (id: string) => void;
}

export const Timeline = ({
  items,
  onRemove,
  onReorder,
  onDurationChange,
  onTextOverlayClick,
}: TimelineProps) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Drag start
  const startDrag = (index: number) => {
    setDragIndex(index);
  };

  // Drag over
  const onDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    onReorder(dragIndex, index);
    setDragIndex(index);
  };

  // Drag end
  const endDrag = () => setDragIndex(null);

  const iconFor = (item: MediaItem) => {
    switch (item.type) {
      case "image":
        return <ImageIcon className="w-4 h-4" />;
      case "video":
        return <VideoIcon className="w-4 h-4" />;
      case "title":
        return <Type className="w-4 h-4" />;
      case "location":
        return <MapPin className="w-4 h-4" />;
      default:
        return <Type className="w-4 h-4" />;
    }
  };

  const labelFor = (item: MediaItem) => {
    switch (item.type) {
      case "image":
        return "Image";
      case "video":
        return "Video";
      case "title":
        return "Title Card";
      case "location":
        return "Location";
      default:
        return "Clip";
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-12 w-full max-w-[750px]">
      {items.map((item, index) => {
        const dragging = dragIndex === index;

        return (
          <Card
            key={item.id}
            draggable
            onDragStart={() => startDrag(index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDragEnd={endDrag}
            className={[
              "flex flex-col gap-4 border rounded-3xl p-6 transition-all bg-card/80 backdrop-blur-sm",
              dragging
                ? "ring-2 ring-primary shadow-xl scale-[1.01]"
                : "hover:shadow-lg",
            ].join(" ")}
          >
            {/* TOP ROW — icon + type label + filename + delete */}
            <div className="flex items-center gap-4">
              <GripVertical className="w-4 h-4 text-muted-foreground" />

              <div className="flex items-center gap-2 text-sm font-semibold">
                {iconFor(item)}
                {labelFor(item)}
              </div>

              <div className="ml-auto text-xs text-muted-foreground truncate max-w-[45%]">
                {item.file?.name || item.location || "Generated clip"}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(item.id)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* PREVIEW BLOCK — 240×160 preview */}
            <div className="flex items-start gap-6">
              <div className="w-[240px] h-[160px] bg-muted rounded-xl overflow-hidden flex items-center justify-center shadow-sm">
                {/* VIDEO preview */}
                {item.type === "video" && (
                  <video
                    src={item.url || item.thumbnail}
                    className="w-full h-full object-cover"
                    preload="metadata"
                    muted
                  />
                )}

                {/* IMAGE preview */}
                {item.type === "image" && item.thumbnail && (
                  <img
                    src={item.thumbnail}
                    className="w-full h-full object-cover"
                    alt="preview"
                  />
                )}

                {/* TITLE / LOCATION */}
                {(item.type === "title" || item.type === "location") && (
                  <div className="text-xs text-muted-foreground text-center p-3">
                    {item.file?.name || item.location || "Title card"}
                  </div>
                )}

                {/* Fallback */}
                {!item.thumbnail &&
                  item.type !== "video" &&
                  item.type !== "title" && (
                    <div className="text-xs text-muted-foreground">
                      preview
                    </div>
                  )}
              </div>

              {/* RIGHT SIDE — metadata + controls */}
              <div className="flex-1 flex flex-col gap-3 mt-1 text-sm">
                {/* Metadata row */}
                <div className="text-muted-foreground text-xs">
                  {item.type === "image" &&
                    `Duration: ${item.duration ?? 3}s • ${item.file?.name || ""}`}

                  {item.type === "video" &&
                    `Video length: ${
                      item.videoLength ? `${item.videoLength}s` : "Unknown"
                    } • ${item.file?.name || ""}`}
                </div>

                {/* Duration slider (images only) */}
                {item.type === "image" && (
                  <div className="space-y-1">
                    <input
                      type="range"
                      min={1}
                      max={15}
                      value={item.duration ?? 3}
                      onChange={(e) =>
                        onDurationChange(item.id, Number(e.target.value))
                      }
                      className="w-full accent-primary"
                    />
                  </div>
                )}

                {/* Text overlay button */}
                {onTextOverlayClick && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-fit text-xs"
                    onClick={() => onTextOverlayClick(item.id)}
                  >
                    Edit text overlay
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
