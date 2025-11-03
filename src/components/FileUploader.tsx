import { useCallback } from "react";
import { Upload, Image, Video } from "lucide-react";
import { toast } from "sonner";

interface FileUploaderProps {
  onFilesAdded: (files: File[]) => void;
}

export const FileUploader = ({ onFilesAdded }: FileUploaderProps) => {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files).filter(
        (file) =>
          file.type.startsWith("image/") || file.type.startsWith("video/")
      );
      if (files.length > 0) {
        onFilesAdded(files);
        toast.success(`${files.length} fájl hozzáadva`);
      } else {
        toast.error("Csak kép és videó fájlokat adhatsz hozzá");
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
        toast.success(`${files.length} fájl hozzáadva`);
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
        accept="image/*,video/*"
        onChange={handleFileInput}
        className="hidden"
        id="file-input"
      />
      <label htmlFor="file-input" className="cursor-pointer">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div className="p-4 rounded-full bg-primary/10">
              <Image className="w-8 h-8 text-primary" />
            </div>
            <div className="p-4 rounded-full bg-primary/10">
              <Video className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground mb-2">
              Húzd ide a fájlokat vagy kattints a tallózáshoz
            </p>
            <p className="text-sm text-muted-foreground">
              Támogatott formátumok: képek (JPG, PNG, GIF) és videók (MP4, WebM)
            </p>
          </div>
        </div>
      </label>
    </div>
  );
};
