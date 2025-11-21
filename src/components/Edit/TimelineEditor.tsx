import { useState, useEffect, useCallback } from "react";
import { GripVertical, ImageIcon, VideoIcon, Timer, AlignLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface TimelineItem {
  id: string;
  type: "title" | "globe" | "image" | "video" | "outro";
  file?: File;
  url?: string;
  duration?: number; // images
  startTime?: number; // videos
  endTime?: number;   // videos
}

interface TimelineEditorProps {
  items: TimelineItem[];
  onChange: (items: TimelineItem[]) => void;
  onOpenTextEditor: (id: string) => void;
  onPreviewRequest?: (items: TimelineItem[]) => void;
}

export default function TimelineEditor({
  items,
  onChange,
  onOpenTextEditor,
  onPreviewRequest,
}: TimelineEditorProps) {
  const [order, setOrder] = useState<TimelineItem[]>(items);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // ------------------------------------------
  // SYNC PROPS → LOCAL ORDERED STATE
  // ------------------------------------------
  useEffect(() => {
    setOrder(items);
  }, [items]);

  // ------------------------------------------
  // DRAG & DROP
  // ------------------------------------------
  const onDragStart = (i: number) => setDragIndex(i);

  const onDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === i) return;

    const updated = [...order];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(i, 0, moved);

    setDragIndex(i);
    setOrder(updated);
  };

  const onDragEnd = () => {
    setDragIndex(null);
    onChange(order);
    onPreviewRequest?.(order);
  };

  // ------------------------------------------
  // UPDATE IMAGE DURATION
  // ------------------------------------------
  const updateImageDuration = (id: string, duration: number) => {
    const updated = order.map((item) =>
      item.id === id ? { ...item, duration } : item
    );
    setOrder(updated);
    onChange(updated);
    onPreviewRequest?.(updated);
  };

  // ------------------------------------------
  // UPDATE VIDEO TRIM
  // ------------------------------------------
  const updateVideoTrim = (
    id: string,
    start: number,
    end: number
  ) => {
    const updated = order.map((item) =>
      item.id === id ? { ...item, startTime: start, endTime: end } : item
    );

    setOrder(updated);
    onChange(updated);
    onPreviewRequest?.(updated);
  };

  // ------------------------------------------
  // TIMELINE CARD RENDER
  // ------------------------------------------
  const renderItem = (item: TimelineItem, index: number) => {
    const isVideo = item.type === "video";
    const isImage = item.type === "image";

    return (
      <Card
        key={item.id}
        draggable
        onDragStart={() => onDragStart(index)}
        onDragOver={(e) => onDragOver(e, index)}
        onDragEnd={onDragEnd}
        className="p-4 bg-card border hover:shadow-md transition-all cursor-grab relative flex flex-col gap-3"
      >
        {/* Drag handle */}
        <div className="absolute left-2 top-2 text-muted-foreground">
          <GripVertical className="w-4 h-4" />
        </div>

        {/* TYPE LABEL */}
        <div className="pl-6">
          {item.type === "title" && (
            <div className="flex items-center gap-2 font-semibold">
              <AlignLeft className="w-4 h-4" /> Title Card
            </div>
          )}

          {item.type === "globe" && (
            <div className="flex items-center gap-2 font-semibold">
              🌍 Globe Animation
            </div>
          )}

          {isImage && (
            <div className="flex items-center gap-2 font-semibold">
              <ImageIcon className="w-4 h-4" /> Image
            </div>
          )}

          {isVideo && (
            <div className="flex items-center gap-2 font-semibold">
              <VideoIcon className="w-4 h-4" /> Video Clip
            </div>
          )}

          {item.type === "outro" && (
            <div className="flex items-center gap-2 font-semibold">
              ⭐ Outro Logo
            </div>
          )}
        </div>

        {/* IMAGE DURATION CONTROL */}
        {isImage && (
          <div className="pl-6">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <Timer className="w-4 h-4" /> Display Duration (sec)
            </label>
            <Input
              type="number"
              min={1}
              value={item.duration ?? 3}
              className="mt-1 w-24"
              onChange={(e) =>
                updateImageDuration(item.id, Number(e.target.value))
              }
            />
          </div>
        )}

        {/* VIDEO TRIM */}
        {isVideo && (
          <div className="pl-6 flex flex-col gap-2">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <Timer className="w-4 h-4" /> Trim Video
            </label>

            <div className="flex flex-col gap-1">
              <input
                type="range"
                min={0}
                max={item.endTime ?? 30}
                value={item.startTime ?? 0}
                onChange={(e) =>
                  updateVideoTrim(
                    item.id,
                    Number(e.target.value),
                    item.endTime ?? 0
                  )
                }
              />
              <input
                type="range"
                min={item.startTime ?? 0}
                max={item.endTime ?? 30}
                value={item.endTime ?? 30}
                onChange={(e) =>
                  updateVideoTrim(
                    item.id,
                    item.startTime ?? 0,
                    Number(e.target.value)
                  )
                }
              />
            </div>

            <div className="flex gap-3">
              <Input
                type="number"
                className="w-20"
                value={item.startTime ?? 0}
                onChange={(e) =>
                  updateVideoTrim(
                    item.id,
                    Number(e.target.value),
                    item.endTime ?? 0
                  )
                }
              />
              <Input
                type="number"
                className="w-20"
                value={item.endTime ?? 30}
                onChange={(e) =>
                  updateVideoTrim(
                    item.id,
                    item.startTime ?? 0,
                    Number(e.target.value)
                  )
                }
              />
            </div>
          </div>
        )}

        {/* OPEN TEXT OVERLAY */}
        {(isImage || isVideo) && (
          <div className="pl-6">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onOpenTextEditor(item.id)}
            >
              Edit Text Overlay
            </Button>
          </div>
        )}
      </Card>
    );
  };

  // ------------------------------------------
  // RENDER
  // ------------------------------------------
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
      {order.map((item, i) => renderItem(item, i))}
    </div>
  );
}

