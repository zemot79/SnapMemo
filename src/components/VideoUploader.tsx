import { useCallback } from "react";
import { Upload, Video } from "lucide-react";
import { toast } from "sonner";

interface VideoUploaderProps {
  onFilesAdded: (files: File[]) => void;
}

export const VideoUploader = ({ onFilesAdded }: VideoUploaderProps) => {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("video/")
      );
      if (files.length > 0) {
        onFilesAdded(files);
        toast.success(`${files.length} videos added`);
      } else {
        toast.error("Only video files can be added");
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
        toast.success(`${files.length} videos added`);
      }
    },
    [onFilesAdded]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed border-accent/30 rounded-lg p-12 text-center hover:border-accent/60 transition-colors cursor-pointer bg-card/50 backdrop-blur"
    >
      <input
        type="file"
        multiple
        accept="video/*"
        onChange={handleFileInput}
        className="hidden"
        id="video-input"
      />
      <label htmlFor="video-input" className="cursor-pointer">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-4">
            <div className="p-4 rounded-full bg-accent/10">
              <Upload className="w-8 h-8 text-accent" />
            </div>
            <div className="p-4 rounded-full bg-accent/10">
              <Video className="w-8 h-8 text-accent" />
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground mb-2">
              Drag videos here or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              Supported formats: MP4, WebM, MOV, AVI
            </p>
          </div>
        </div>
      </label>
    </div>
  );
};
