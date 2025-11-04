import { useState, useRef } from "react";
import { MediaItem } from "./Timeline";
import { X, Target } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface ImageEditorProps {
  images: MediaItem[];
  onRemove: (id: string) => void;
  onFocalPointChange: (id: string, focalPoint: { x: number; y: number }) => void;
}

export const ImageEditor = ({
  images,
  onRemove,
  onFocalPointChange,
}: ImageEditorProps) => {
  const [activeImageId, setActiveImageId] = useState<string | null>(null);

  const handleImageClick = (
    e: React.MouseEvent<HTMLDivElement>,
    imageId: string
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    onFocalPointChange(imageId, { x, y });
    setActiveImageId(imageId);
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Még nincs kép hozzáadva</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {images.map((image) => (
        <Card key={image.id} className="overflow-hidden group relative">
          <div
            className="relative aspect-video bg-muted cursor-crosshair"
            onClick={(e) => handleImageClick(e, image.id)}
          >
            {image.thumbnail && (
              <img
                src={image.thumbnail}
                alt={image.file.name}
                className="w-full h-full object-cover"
              />
            )}
            {image.focalPoint && (
              <div
                className="absolute w-8 h-8 -ml-4 -mt-4 pointer-events-none"
                style={{
                  left: `${image.focalPoint.x}%`,
                  top: `${image.focalPoint.y}%`,
                }}
              >
                <Target className="w-8 h-8 text-primary drop-shadow-lg animate-pulse" />
              </div>
            )}
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(image.id);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-3 bg-card">
            <p className="text-sm font-medium truncate">{image.file.name}</p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                {image.focalPoint
                  ? `Fókusz: ${Math.round(image.focalPoint.x)}%, ${Math.round(image.focalPoint.y)}%`
                  : "Kattints a fókusz megadásához"}
              </p>
              <p className="text-xs text-primary font-medium">
                {image.duration} mp
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
