import React from "react";
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

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

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
  clips?: { id: string; startTime: number; endTime: number }[];
  kenBurns?: KenBurnsSettings;
  textOverlays?: TextOverlay[];
  title?: string;
  description?: string;
  focalPoint?: { x: number; y: number } | null;
  videoLength?: number;
  width?: number;
  height?: number;
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

// ---- SEGÉDFÜGGVÉNY -------------------------------------------------------

const formatSeconds = (value?: number) => {
  if (!value || !Number.isFinite(value)) return "Unknown";
  if (value < 10) return value.toFixed(1) + "s";
  return Math.round(value) + "s";
};

// ---- SORTABLE ITEM -------------------------------------------------------

const SortableItem = ({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

// ---- FŐ KOMPONENS --------------------------------------------------------

export const Timeline: React.FC<TimelineProps> = ({
  items,
  onRemove,
  onReorder,
  onDurationChange,
  onTextOverlayClick,
}) => {
  const renderPreview = (item: MediaItem) => {
    if (item.type === "video") {
      const src = item.url || item.thumbnail;
      if (src) {
        return (
          <video
            src={src}
            className="w-full h-full object-cover rounded-lg"
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

    if (item.type === "image" && item.thumbnail) {
      return (
        <img
          src={item.thumbnail}
          alt={item.file?.name || "Image"}
          className="w-full h-full object-cover rounded-lg"
        />
      );
    }

    if (
      item.type === "titleCard" ||
      item.type === "logoCard" ||
      item.type === "title"
    ) {
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

  // ---- DNDKIT CONFIG ------------------------------------------------------

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // ---- RETURN --------------------------------------------------------------

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(event) => {
        const { active, over } = event;
        if (!over) return;

        if (active.id !== over.id) {
          const oldIndex = items.findIndex((i) => i.id === active.id);
          const newIndex = items.findIndex((i) => i.id === over.id);
          onReorder(oldIndex, newIndex);
        }
      }}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-5 pb-12 w-full max-w-[750px]">
          {items.map((item) => (
            <SortableItem key={item.id} id={item.id}>
              <Card
                className={[
                  "flex flex-col gap-4 border rounded-3xl p-6 transition-all bg-card/90 backdrop-blur-sm cursor-pointer",
                  "hover:shadow-xl hover:scale-[1.01]",
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
                      (item.type === "logoCard"
                        ? "SnapMemo logo"
                        : "Generated clip")}
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

                {/* BODY */}
                <div className="flex items-start gap-6">
                  {/* PREVIEW */}
                  <div
                    className="
                      w-[320px] h-[200px] 
                      bg-muted rounded-xl overflow-hidden 
                      flex items-center justify-center 
                      shadow-md hover:shadow-lg 
                      transition-all
                    "
                  >
                    {renderPreview(item)}
                  </div>

                  {/* RIGHT SIDE */}
                  <div className="flex-1 flex flex-col gap-3 mt-1 text-sm">
                    {/* META */}
                    <div className="text-[11px] text-muted-foreground space-x-2">
                      {item.type === "image" && (
                        <>
                          <span>
                            Duration: {formatSeconds(item.duration ?? 3)}
                          </span>
                          {item.file?.name && (
                            <span>• {item.file.name}</span>
                          )}
                        </>
                      )}

                      {item.type === "video" && (
                        <>
                          <span>
                            Video length:{" "}
                            {formatSeconds(
                              item.videoLength ?? item.duration
                            )}
                          </span>
                          {item.width && item.height && (
                            <span>
                              • {item.width}×{item.height}
                            </span>
                          )}
                          {item.file?.name && (
                            <span>• {item.file.name}</span>
                          )}
                        </>
                      )}

                      {item.type === "titleCard" && (
                        <span>
                          Title card is generated from your images and text.
                        </span>
                      )}

                      {item.type === "logoCard" && (
                        <span>
                          Outro logo – fixed duration at the end of the video.
                        </span>
                      )}
                    </div>

                    {/* IMAGE SLIDER */}
                    {item.type === "image" && (
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

                    {/* TEXT OVERLAY */}
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
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
