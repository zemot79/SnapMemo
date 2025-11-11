import { useCallback } from "react";
import { Upload, Image } from "lucide-react";
import { toast } from "sonner";

interface ImageUploaderProps {
  onFilesAdded: (files: File[]) => void;
}

export const ImageUploader = ({ onFilesAdded }: ImageUploaderProps) => {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );
      if (files.length > 0) {
        onFilesAdded(files);
        toast.success(`${files.length} images added`);
      } else {
        toast.error("Only image files can be added");
      }
    },
    [onFilesAdded]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        onFilesAdded(files);
        toast.success(`${files.length} images added`);
      }
    },
    [onFilesAdded]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed border-primary/30 rounded-lg p-12 text-center hover:border-primary/60 transition-colors cursor-pointer bg-card/50 backdrop-blur"
    >
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
        id="image-input"
      />
      <label htmlFor="image-input" className="cursor-pointer">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div className="p-4 rounded-full bg-primary/10">
              <Image className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground mb-2">
              Drag images here or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              Supported formats: JPG, PNG, GIF, WebP
            </p>
          </div>
        </div>
      </label>
    </div>
  );
};
