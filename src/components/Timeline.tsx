import { GripVertical, X, Clock, Zap, Type } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useState } from "react";

export interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor?: string;
  opacity: number;
}

export interface MediaItem {
  id: string;
  file: File;
  type: "image" | "video" | "titleCard" | "logoCard";
  duration: number;
  thumbnail?: string;
  focalPoint?: { x: number; y: number }[];
  clips?: { id: string; startTime: number; endTime: number }[];
  metadata?: {
    title?: string;
    description?: string;
    date?: string;
  };
  kenBurns?: {
    enabled: boolean;
    effect: "zoomIn" | "zoomOut" | "panLeft" | "panRight";
  };
  textOverlays?: TextOverlay[];
}

interface TimelineProps {
  items: MediaItem[];
  onRemove: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onDurationChange: (id: string, duration: number) => void;
  onKenBurnsChange?: (id: string, kenBurns: { enabled: boolean; effect: "zoomIn" | "zoomOut" | "panLeft" | "panRight" }) => void;
  onTextOverlayClick?: (id: string) => void;
  location?: string;
}

export const Timeline = ({
  items,
  onRemove,
  onReorder,
  onDurationChange,
  onKenBurnsChange,
  onTextOverlayClick,
  location,
}: TimelineProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      onReorder(draggedIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No media added yet</p>
        <p className="text-sm mt-2">Add images or videos to get started</p>
      </div>
    );
  }

  const globeDuration = 3; // 3 seconds for globe animation
  const titleCardDuration = 4; // 4 seconds for title card
  const logoCardDuration = 2; // 2 seconds for logo card
  const specialItems = (location ? 1 : 0) + (items.some(i => i.type === "titleCard") ? 1 : 0) + (items.some(i => i.type === "logoCard") ? 1 : 0);
  const totalItems = items.length + specialItems;
  const baseDuration = items.reduce((acc, item) => acc + item.duration, 0);
  const totalDuration = baseDuration + (location ? globeDuration : 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Timeline ({totalItems} items)
        </h3>
        <div className="text-sm text-muted-foreground">
          Total duration: {Math.round(totalDuration)} sec
        </div>
      </div>
      <div className="space-y-2">
        {/* Globe Animation Item */}
        {location && (
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg border border-primary/50">
            <div className="w-5 h-5 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                <path d="M2 12h20"/>
              </svg>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                <path d="M2 12h20"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">🌍 Location Animation</p>
              <p className="text-xs text-muted-foreground truncate">{location}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-primary">{globeDuration} sec</span>
            </div>
          </div>
        )}
        
        {/* Title Card Item */}
        {items.filter(i => i.type === "titleCard").map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-accent/20 to-primary/20 rounded-lg border border-accent/50">
            <div className="w-5 h-5 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
              {item.thumbnail && (
                <img
                  src={item.thumbnail}
                  alt="Title card"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">📄 Title Card</p>
              <p className="text-xs text-muted-foreground truncate">{item.metadata?.title || "Untitled"}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-accent">{item.duration} sec</span>
            </div>
          </div>
        ))}
        {items.filter(item => item.type !== "titleCard" && item.type !== "logoCard").map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-3 p-3 bg-secondary rounded-lg border transition-all group ${
              draggedIndex === index
                ? "opacity-50 scale-95"
                : dragOverIndex === index
                ? "border-primary ring-2 ring-primary/50"
                : "border-border hover:border-primary/50"
            }`}
          >
            <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
            <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
              {item.thumbnail && (
                <img
                  src={item.thumbnail}
                  alt={item.file.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <p className="text-sm font-medium truncate">{item.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.type === "image" ? "Image" : item.type === "video" ? "Video" : "Title Card"}
                </p>
              </div>
              
              {/* Ken Burns Effect for Images */}
              {item.type === "image" && onKenBurnsChange && (
                <div className="flex items-center gap-3 pt-1 border-t border-border/50">
                  <Zap className="w-3.5 h-3.5 text-tertiary" />
                  <div className="flex items-center gap-2 flex-1">
                    <Switch
                      id={`kenburns-${item.id}`}
                      checked={item.kenBurns?.enabled || false}
                      onCheckedChange={(checked) =>
                        onKenBurnsChange(item.id, {
                          enabled: checked,
                          effect: item.kenBurns?.effect || "zoomIn"
                        })
                      }
                    />
                    <Label htmlFor={`kenburns-${item.id}`} className="text-xs cursor-pointer">
                      Ken Burns
                    </Label>
                  </div>
                  {item.kenBurns?.enabled && (
                    <Select
                      value={item.kenBurns.effect}
                      onValueChange={(value: any) =>
                        onKenBurnsChange(item.id, {
                          enabled: true,
                          effect: value
                        })
                      }
                    >
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zoomIn">Zoom In</SelectItem>
                        <SelectItem value="zoomOut">Zoom Out</SelectItem>
                        <SelectItem value="panLeft">Pan Left</SelectItem>
                        <SelectItem value="panRight">Pan Right</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
              
              {/* Text Overlay Button */}
              {onTextOverlayClick && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onTextOverlayClick(item.id)}
                  className="h-7 text-xs gap-1.5"
                >
                  <Type className="w-3.5 h-3.5" />
                  Text ({item.textOverlays?.length || 0})
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={item.duration}
                onChange={(e) =>
                  onDurationChange(item.id, Number(e.target.value))
                }
                min="1"
                max="60"
                className="w-20 h-9"
              />
              <span className="text-sm text-muted-foreground">sec</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(item.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
        
        {/* Logo Card Item - Always at the end */}
        {items.filter(i => i.type === "logoCard").map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg border border-primary/50">
            <div className="w-5 h-5 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
              {item.thumbnail && (
                <img
                  src={item.thumbnail}
                  alt="Logo card"
                  className="w-full h-full object-contain p-2"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">🎬 SnapMemo Logo</p>
              <p className="text-xs text-muted-foreground">Closing card</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-primary">{item.duration} sec</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Total Video Duration Counter */}
      <div className="mt-4 p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Total Video Duration</span>
          </div>
          <div className="text-2xl font-bold text-primary">
            {Math.round(totalDuration)} sec
          </div>
        </div>
      </div>
    </div>
  );
};
