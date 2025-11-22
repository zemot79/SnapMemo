import type React from "react";
import { useState, useEffect } from "react";
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

const isPinned = (item: TimelineItem) =>
  item.type === "title" || item.type === "globe" || item.type === "outro";

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
  // DRAG & DROP (csak a nem „pinned” elemek húzhatóak)
  // ------------------------------------------
  const onDragStart = (i: number) => {
    if (isPinned(order[i])) return; // title / globe / outro fix helyen marad
    setDragIndex(i);
  };

  const onDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === i) return;
    if (isPinned(order[i])) return; // pinned elem helyére ne toljunk semmit

    const updated = [...order];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(i, 0, moved);

    setDragIndex(i);
    setOrder(updated);
  };

  const onDragEnd = () => {
    if (dragIndex === null) return;
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
    if (end < start) end = start;

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
    const pinned = isPinned(item);
    const baseDuration = item.duration ?? 3;
    const start = item.startTime ?? 0;
    const end = item.endTime ?? 30;

    return (
      <Card
        key={item.id}
        draggable={!pinned}
        onDragStart={() => onDragStart(index)}
        onDragOver={(e) => onDragOver(e, index)}
        onDragEnd={onDragEnd}
        className={`p-4 bg-card border hover:shadow-md transition-all ${
          pinned ? "cursor-default" : "cursor-grab"
        } relative flex flex-col gap-3`}
      >
        {/* Drag handle */}
        <div className="absolute left-2 top-2 text-muted-foreground">
          <GripVertical className="w-4 h-4 opacity-70" />
        </div>

        {/* TYPE LABEL */}
        <div className="pl-6 flex items-center justify-between gap-2">
          <div>
            {item.type === "title" && (
              <div className="flex items-center gap-2 font-semibold">
                <AlignLeft className="w-4 h-4" /> Title card
              </div>
            )}

            {item.type === "globe" && (
              <div className="flex items-center gap-2 font-semibold">
                <span className="text-lg">🌍</span> Globe animation
              </div>
            )}

            {isImage && (
              <div className="flex items-center gap-2 font-semibold">
                <ImageIcon className="w-4 h-4" /> Image
              </div>
            )}

            {isVideo && (
              <div className="flex items-center gap-2 font-semibold">
                <VideoIcon className="w-4 h-4" /> Video clip
              </div>
            )}

            {item.type === "outro" && (
              <div className="flex items-center gap-2 font-semibold">
                ⭐ Outro logo
              </div>
            )}
          </div>

          {pinned && (
            <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
              Fixed position
            </span>
          )}
        </div>

        {/* IMAGE DURATION CONTROL */}
        {isImage && (
          <div className="pl-6">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <Timer className="w-4 h-4" /> Display duration (sec)
            </label>
            <Input
              type="number"
              min={1}
              value={baseDuration}
              className="mt-1 w-24"
              onChange={(e) =>
                updateImageDuration(item.id, Number(e.target.value) || 1)
              }
              onMouseDown={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* VIDEO TRIM */}
        {isVideo && (
          <div className="pl-6 flex flex-col gap-2">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <Timer className="w-4 h-4" /> Trim video (sec)
            </label>

            <div className="flex flex-col gap-1">
              <input
                type="range"
                min={0}
                max={end}
                value={start}
                onChange={(e) =>
                  updateVideoTrim(
                    item.id,
                    Number(e.target.value),
                    end
                  )
                }
                onMouseDown={(e) => e.stopPropagation()}
              />
              <input
                type="range"
                min={start}
                max={Math.max(end, start + 1)}
                value={end}
                onChange={(e) =>
                  updateVideoTrim(
                    item.id,
                    start,
                    Number(e.target.value)
                  )
                }
                onMouseDown={(e) => e.stopPropagation()}
              />
            </div>

            <div className="flex gap-3">
              <Input
                type="number"
                className="w-20"
                value={start}
                onChange={(e) =>
                  updateVideoTrim(
                    item.id,
                    Number(e.target.value) || 0,
                    end
                  )
                }
                onMouseDown={(e) => e.stopPropagation()}
              />
              <Input
                type="number"
                className="w-20"
                value={end}
                onChange={(e) =>
                  updateVideoTrim(
                    item.id,
                    start,
                    Number(e.target.value) || start + 1
                  )
                }
                onMouseDown={(e) => e.stopPropagation()}
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
              Edit text overlay
            </Button>
          </div>
        )}
      </Card>
    );
  };

  // ------------------------------------------
  // RENDER – EGY OSZLOP, NAGY KÁRTYÁK
  // ------------------------------------------
  return (
    <div className="flex flex-col gap-4">
      {order.map((item, i) => renderItem(item, i))}
    </div>
  );
}
