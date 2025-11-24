import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  GripVertical,
  Trash2,
  Type as TypeIcon,
  Image as ImageIcon,
  Video as VideoIcon,
  MapPin,
} from "lucide-react";

// ---- TÍPUSOK -------------------------------------------------------------

export type MediaItemType =
  | "image"
  | "video"
  | "title"
  | "location"
  | "titleCard"
  | "logoCard";

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
  focalPoint?: { x: number; y: number } | null;
  // videó metaadatok
  videoLength?: number;
  width?: number;
  height?: number;
  // helyszín
  location?: string;
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

// ---- SEGÉDFÜGGVÉNYEK -----------------------------------------------------

const formatSeconds = (value?: number) => {
  if (!value || !Number.isFinite(value)) return "Unknown";
  if (value < 10) return value.toFixed(1) + "s";
  return Math.round(value) + "s";
};

// ---- FŐ KOMPONENS --------------------------------------------------------

export const Timeline: React.FC<TimelineProps> = ({
  items,
  onRemove,
  onReorder,
  onDurationChange,
  onTextOverlayClick,
}) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    // azonnal frissítjük a sorrendet a szülőben
    onReorder(dragIndex, index);
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const renderPreview = (item: MediaItem) => {
    // video
    if (item.type === "video") {
      const src = item.url || item.thumbnail;
      if (src) {
        return (
          <video
            src={src}
            className="w-full h-full object-cover"
            preload="metadata"
            muted
          />
        );
      }
      return (
        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
          <VideoIcon className="w-6 h-6" />
        </div>
      );
    }

    // image
    if (item.type === "image" && item.thumbnail) {
      return (
        <img
          src={item.thumbnail}
          alt={item.file?.name || "Image"}
          className="w-full h-full object-cover"
        />
      );
    }

    // title / logo / location
    if (item.type === "titleCard" || item.type === "logoCard" || item.type === "title") {
      return (
        <div className="w-full h-full flex items-center justify-center text-[11px] text-muted-foreground px-3 text-center">
          {item.file?.name || item.title || "Title card"}
        </div>
      );
    }

    if (item.type === "location") {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-[11px] text-muted-foreground px-3 text-center gap-1">
          <MapPin className="w-4 h-4" />
          <span>{item.location || "Location"}</span>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
        Preview
      </div>
    );
  };

  const iconFor = (item: MediaItem) => {
    switch (item.type) {
      case "image":
        return <ImageIcon className="w-4 h-4" />;
      case "video":
        return <VideoIcon className="w-4 h-4" />;
      case "title":
      case "titleCard":
      case "logoCard":
        return <TypeIcon className="w-4 h-4" />;
      case "location":
        return <MapPin className="w-4 h-4" />;
      default:
        return <TypeIcon className="w-4 h-4" />;
    }
  };

  const labelFor = (item: MediaItem) => {
    switch (item.type) {
      case "image":
        return "Image";
      case "video":
        return "Video";
      case "title":
      case "titleCard":
        return "Title card";
      case "logoCard":
        return "Outro logo";
      case "location":
        return "Location";
      default:
        return "Clip";
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-12 w-full max-w-[750px]">
      {items.map((item, index) => {
        const isDragging = dragIndex === index;
        const isImage = item.type === "image";
        const isVideo = item.type === "video";

        const videoInfo =
          isVideo && (item.videoLength || item.duration)
            ? formatSeconds(item.videoLength ?? item.duration)
            : "Unknown";

        return (
          <React.Fragment key={item.id}>
            <Card
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={[
                "flex flex-col gap-4 border rounded-3xl p-6 transition-all bg-card/80 backdrop-blur-sm",
                isDragging
                  ? "ring-2 ring-primary shadow-xl scale-[1.01]"
                  : "hover:shadow-lg",
              ].join(" ")}
            >
              {/* HEADER */}
              <div className="flex items-center gap-4">
                <div className="p-1 rounded-md bg-muted flex items-center justify-center">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                </div>

                <div className="flex items-center gap-2 text-sm font-semibold">
                  {iconFor(item)}
                  {labelFor(item)}
                </div>

                <div className="ml-auto text-xs text-muted-foreground truncate max-w-[45%]">
                  {item.file?.name ||
                    item.location ||
                    item.title ||
                    (item.type === "logoCard" ? "SnapMemo logo" : "Generated clip")}
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

              {/* BODY: PREVIEW + META + CONTROLS */}
              <div className="flex items-start gap-6">
                {/* PREVIEW */}
                <div className="w-[240px] h-[160px] bg-muted rounded-xl overflow-hidden flex items-center justify-center shadow-sm">
                  {renderPreview(item)}
                </div>

                {/* RIGHT SIDE */}
                <div className="flex-1 flex flex-col gap-3 mt-1 text-sm">
                  {/* META ROW */}
                  <div className="text-[11px] text-muted-foreground space-x-2">
                    {isImage && (
                      <>
                        <span>Duration: {formatSeconds(item.duration ?? 3)}</span>
                        {item.file?.name && <span>• {item.file.name}</span>}
                      </>
                    )}

                    {isVideo && (
                      <>
                        <span>Video length: {videoInfo}</span>
                        {item.width && item.height && (
                          <span>
                            {" "}
                            • {item.width}×{item.height}
                          </span>
                        )}
                        {item.file?.name && <span> • {item.file.name}</span>}
                      </>
                    )}

                    {item.type === "titleCard" && (
                      <span>Title card is generated from your images and text.</span>
                    )}

                    {item.type === "logoCard" && (
                      <span>Outro logo – fixed duration at the end of the video.</span>
                    )}
                  </div>

                  {/* IMAGE DURATION SLIDER */}
                  {isImage && (
                    <div className="space-y-1">
                      <input
                        type="range"
                        min={1}
                        max={15}
                        step={1}
                        value={item.duration ?? 3}
                        onChange={(e) =>
                          onDurationChange(item.id, Number(e.target.value))
                        }
                        className="w-full accent-primary"
                      />
                    </div>
                  )}

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
                </div>
              </div>
            </Card>

            {/* TRANSITION PREVIEW KÁRTYÁK KÖZÖTT */}
            {index < items.length - 1 && (
              <div className="pl-10">
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
