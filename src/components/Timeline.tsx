import { GripVertical, X, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export interface MediaItem {
  id: string;
  file: File;
  type: "image" | "video";
  duration: number;
  thumbnail?: string;
  focalPoint?: { x: number; y: number };
  startTime?: number;
  endTime?: number;
}

interface TimelineProps {
  items: MediaItem[];
  onRemove: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onDurationChange: (id: string, duration: number) => void;
}

export const Timeline = ({
  items,
  onRemove,
  onReorder,
  onDurationChange,
}: TimelineProps) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Még nincs média hozzáadva</p>
        <p className="text-sm mt-2">Adj hozzá képeket vagy videókat a kezdéshez</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Idővonal ({items.length} elem)
        </h3>
        <div className="text-sm text-muted-foreground">
          Teljes időtartam:{" "}
          {Math.round(items.reduce((acc, item) => acc + item.duration, 0))} mp
        </div>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 bg-secondary rounded-lg border border-border hover:border-primary/50 transition-colors group"
          >
            <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
            <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
              {item.thumbnail && (
                <img
                  src={item.thumbnail}
                  alt={item.file.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.file.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.type === "image" ? "Kép" : "Videó"}
              </p>
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
              <span className="text-sm text-muted-foreground">mp</span>
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
      </div>
    </div>
  );
};
