import { useState } from "react";
import { MediaItem } from "./Timeline";
import { X, Target, GripVertical } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface ImageEditorProps {
  images: MediaItem[];
  onRemove: (id: string) => void;
  onFocalPointChange: (id: string, focalPoint: { x: number; y: number }[]) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
}

export const ImageEditor = ({
  images,
  onRemove,
  onFocalPointChange,
  onReorder,
}: ImageEditorProps) => {
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleImageClick = (
    e: React.MouseEvent<HTMLDivElement>,
    imageId: string,
    image: MediaItem
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newPoint = { x, y };
    const currentPoints = image.focalPoint || [];
    
    // Add point, max 2 points
    if (currentPoints.length < 2) {
      onFocalPointChange(imageId, [...currentPoints, newPoint]);
    } else {
      // Replace with new array starting with this point
      onFocalPointChange(imageId, [newPoint]);
    }
    setActiveImageId(imageId);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex && onReorder) {
      // Calculate actual indices in the full media items array
      const imageItems = images;
      onReorder(draggedIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No images added yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {images.map((image, index) => (
        <Card 
          key={image.id} 
          draggable={!!onReorder}
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={`overflow-hidden group relative transition-all ${
            index === 0 ? 'ring-4 ring-primary' : ''
          } ${
            draggedIndex === index
              ? "opacity-50 scale-95"
              : dragOverIndex === index
              ? "ring-2 ring-primary"
              : ""
          }`}
        >
          {onReorder && (
            <div className="absolute top-2 left-2 z-10 p-1 bg-background/80 rounded cursor-grab active:cursor-grabbing">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          <div
            className="relative aspect-video bg-muted cursor-crosshair h-64"
            onClick={(e) => handleImageClick(e, image.id, image)}
          >
            {image.thumbnail && (
              <img
                src={image.thumbnail}
                alt={image.file.name}
                className="w-full h-full object-cover"
              />
            )}
            {image.focalPoint && image.focalPoint.map((point, idx) => (
              <div
                key={idx}
                className="absolute w-8 h-8 -ml-4 -mt-4 pointer-events-none"
                style={{
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                }}
              >
                <Target className={`w-8 h-8 drop-shadow-lg ${idx === 0 ? 'text-primary' : 'text-secondary'} animate-pulse`} />
                <span className="absolute top-0 left-0 text-xs font-bold text-white bg-black/50 rounded px-1">
                  {idx + 1}
                </span>
              </div>
            ))}
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
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium truncate">{image.file.name}</p>
              {index === 0 && (
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                  Thumbnail
                </span>
              )}
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                {image.focalPoint && image.focalPoint.length > 0
                  ? `${image.focalPoint.length} point${image.focalPoint.length > 1 ? 's' : ''} set`
                  : "Click to set focus (max 2)"}
              </p>
              <p className="text-xs text-primary font-medium">
                {image.duration} sec
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
