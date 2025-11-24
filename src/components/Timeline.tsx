import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, ImageIcon, VideoIcon, Type, Trash2 } from "lucide-react";

export interface MediaItem {
  id: string;
  type: "image" | "video" | "title" | "location";
  file?: File;
  thumbnail?: string;
  duration?: number; // images
  videoLength?: number; // videos
  location?: string;
}

interface TimelineProps {
  items: MediaItem[];
  onRemove: (id: string) => void;
  onReorder: (from: number, to: number) => void;
  onDurationChange: (id: string, seconds: number) => void;
  onTextOverlayClick?: (id: string) => void;
  location?: string;
}

export const Timeline = ({
  items,
  onRemove,
  onReorder,
  onDurationChange,
  onTextOverlayClick,
}: TimelineProps) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const startDrag = (index: number) => {
    setDragIndex(index);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const updated = [...items];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, moved);

    onReorder(dragIndex, index);
    setDragIndex(index);
  };

  const endDrag = () => setDragIndex(null);

  const getTypeLabel = (item: MediaItem) => {
    switch (item.type) {
      case "image":
        return "Image";
      case "video":
        return "Video";
      case "title":
        return "Title card";
      case "location":
        return "Location";
      default:
        return "Clip";
    }
  };

  const getIcon = (item: MediaItem) => {
    switch (item.type) {
      case "image":
        return <ImageIcon className="w-4 h-4" />;
      case "video":
        return <VideoIcon className="w-4 h-4" />;
      case "title":
        return <Type className="w-4 h-4" />;
      case "location":
        return <Type className="w-4 h-4" />;
      default:
        return <Type className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
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
              "flex flex-col gap-3 border rounded-2xl p-4 bg-card/80 backdrop-blur-sm transition-all",
              dragging ? "ring-2 ring-primary shadow-lg scale-[1.01]" : "hover:shadow-md",
            ].join(" ")}
          >
            {/* FEJLÉC – ikon, típus, fájlnév */}
            <div className="flex items-center gap-3">
              <GripVertical className="w-4 h-4 text-muted-foreground" />

              <div className="flex items-center gap-2 text-sm font-semibold">
                {getIcon(item)}
                {getTypeLabel(item)}
              </div>

              <div className="ml-auto text-xs text-muted-foreground truncate max-w-[40%]">
                {item.file?.name || item.location || "Generated clip"}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-600"
                onClick={() => onRemove(item.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* PREVIEW – kép vagy video bélyegkép */}
            <div className="flex items-center gap-4">
              <div className="w-32 h-20 rounded-xl overflow-hidden bg-muted">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                    {getTypeLabel(item)}
                  </div>
                )}
              </div>

              <div className="flex-1 text-xs space-y-1">
                {item.type === "image" && (
                  <>
                    <div className="text-muted-foreground">
                      Duration: {item.duration}s
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={15}
                      value={item.duration}
                      onChange={(e) => onDurationChange(item.id, Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </>
                )}

                {item.type === "video" && (
                  <div className="text-muted-foreground">
                    Video length: {item.videoLength ? `${item.videoLength}s` : "Unknown"}
                  </div>
                )}
              </div>
            </div>

            {/* TEXT OVERLAY BUTTON */}
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
          </Card>
        );
      })}
    </div>
  );
};
