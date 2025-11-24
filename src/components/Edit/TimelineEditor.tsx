import type React from "react";
import { useState, useEffect } from "react";
import { GripVertical, ImageIcon, VideoIcon, Timer, AlignLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export interface TimelineItem {
  id: string;
  type: "title" | "globe" | "image" | "video" | "outro";
  file?: File;
  url?: string;
  duration?: number; // images (seconds)
  startTime?: number; // videos (seconds)
  endTime?: number;   // videos (seconds)
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
  const onDragStart = (index: number) => {
    if (isPinned(order[index])) return;
    setDragIndex(index);
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
    if (!Number.isFinite(duration) || duration <= 0) duration = 1;
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
  const updateVideoTrim = (id: string, start: number, end: number) => {
    if (!Number.isFinite(start) || start < 0) start = 0;
    if (!Number.isFinite(end) || end < start) end = start;

    const updated = order.map((item) =>
      item.id === id ? { ...item, startTime: start, endTime: end } : item
    );

    setOrder(updated);
    onChange(updated);
    onPreviewRequest?.(updated);
  };

  // ------------------------------------------
  // META INFO HELPERS
  // ------------------------------------------
  const formatSeconds = (value?: number) => {
    if (value == null || Number.isNaN(value)) return "-";
    return `${value.toFixed(1)}s`;
  };

  const getFileLabel = (item: TimelineItem) => {
    if (item.file) {
      const size = (item.file.size ?? 0) / (1024 * 1024);
      const sizeLabel = size > 0 ? `${size.toFixed(1)} MB` : "";
      return `${item.file.name}${sizeLabel ? ` • ${sizeLabel}` : ""}`;
    }
    if (item.url) return item.url.split("/").pop() ?? item.url;
    return "Generated clip";
  };

  const getTypeLabel = (item: TimelineItem) => {
    switch (item.type) {
      case "title":
        return "Title card";
      case "globe":
        return "Globe animation";
      case "image":
        return "Image clip";
      case "video":
        return "Video clip";
      case "outro":
        return "Outro logo";
      default:
        return "Clip";
    }
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
    const end = item.endTime ?? (isVideo ? start + 5 : baseDuration);
    const length = isVideo ? Math.max(0, end - start) : baseDuration;

    const isDragging = dragIndex === index;

    return (
      <Card
        key={item.id}
        draggable={!pinned}
        onDragStart={() => onDragStart(index)}
        onDragOver={(e) => onDragOver(e, index)}
        onDragEnd={onDragEnd}
        className={[
          "p-4 rounded-2xl border bg-card/80 backdrop-blur-sm transition-all flex flex-col gap-3",
          !pinned ? "cursor-grab active:cursor-grabbing" : "cursor-default opacity-95",
          isDragging ? "ring-2 ring-primary/60 shadow-lg scale-[1.01]" : "hover:shadow-md",
        ].join(" ")}
      >
        {/* TOP ROW: HANDLE + LABEL + PIN */}
        <div className="flex items-start gap-3">
          <div className="mt-1 flex flex-col items-center">
            {!pinned && (
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {item.type === "title" && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                  <AlignLeft className="w-3 h-3" />
                  Title
                </span>
              )}
              {item.type === "globe" && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-blue-500/10 text-blue-500">
                  🌍 Globe
                </span>
              )}
              {isImage && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
                  <ImageIcon className="w-3 h-3" />
                  Image
                </span>
              )}
              {isVideo && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-purple-500/10 text-purple-500">
                  <VideoIcon className="w-3 h-3" />
                  Video
                </span>
              )}
              {item.type === "outro" && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-amber-500/10 text-amber-500">
                  ⭐ Outro
                </span>
              )}

              {pinned && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border border-dashed text-muted-foreground">
                  Fixed position
                </span>
              )}
            </div>

            <div className="text-xs text-muted-foreground truncate">
              {getFileLabel(item)}
            </div>
          </div>
        </div>

        {/* PREVIEW STRIP */}
        <div className="flex items-center gap-3">
          <div className="w-28 h-16 rounded-xl bg-muted overflow-hidden flex items-center justify-center text-[11px] text-muted-foreground">
            {item.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.url}
                alt={getTypeLabel(item)}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{getTypeLabel(item)}</span>
            )}
          </div>

          <div className="flex-1 text-xs space-y-1">
            <div className="inline-flex items-center gap-1 text-muted-foreground">
              <Timer className="w-3 h-3" />
              {isImage && (
                <span>Duration: {formatSeconds(baseDuration)}</span>
              )}
              {isVideo && (
                <span>
                  Start {formatSeconds(start)} • End {formatSeconds(end)} • Length{" "}
                  {formatSeconds(length)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col gap-3 mt-1">
          {isImage && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Image duration</span>
                <span>{formatSeconds(baseDuration)}</span>
              </div>
              <input
                type="range"
                min={1}
                max={15}
                step={1}
                value={baseDuration}
                onChange={(e) =>
                  updateImageDuration(item.id, Number(e.target.value))
                }
                className="w-full accent-primary"
              />
            </div>
          )}

          {isVideo && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Trim video</span>
                <span>
                  {formatSeconds(start)} → {formatSeconds(end)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground">
                    Start (s)
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={start}
                    onChange={(e) =>
                      updateVideoTrim(item.id, Number(e.target.value), end)
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground">
                    End (s)
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={end}
                    onChange={(e) =>
                      updateVideoTrim(item.id, start, Number(e.target.value))
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-1">
            <Button
              variant="outline"
              size="xs"
              className="text-[11px]"
              onClick={() => onOpenTextEditor(item.id)}
            >
              Add / Edit text
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  // ------------------------------------------
  // RENDER – ONE COLUMN, LARGE CARDS
  // ------------------------------------------
  if (!order.length) {
    return (
      <Card className="p-4 text-xs text-muted-foreground">
        No clips in timeline yet. Add images or videos first.
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {order.map((item, i) => renderItem(item, i))}
    </div>
  );
}
