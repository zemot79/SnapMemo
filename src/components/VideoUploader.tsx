import { useCallback } from "react";
import { Upload, Video } from "lucide-react";
import { toast } from "sonner";

interface VideoUploaderProps {
  onFilesAdded: (files: File[]) => void | Promise<void>;
}

export const VideoUploader = ({ onFilesAdded }: VideoUploaderProps) => {
  // --- Helper: videó felismerés MIME nélkül is ---
  const isVideoFile = (file: File) => {
    // Ha rendes MIME-type van
    if (file.type && file.type.startsWith("video/")) return true;

    // Ha nincs MIME vagy hibás, nézzük a kiterjesztést
    const ext = file.name.toLowerCase().split(".").pop() || "";
    const videoExts = ["mp4", "mov", "m4v", "3gp", "avi", "mts", "m2ts"];

    return videoExts.includes(ext);
  };

  // --- DROP handler ---
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files).filter(isVideoFile);

      if (files.length > 0) {
        await onFilesAdded(
          files.map((f) => Object.assign(f, { createdAt: f.lastModified }))
        );
      } else {
        toast.error("Only video files can be added");
      }
    },
    [onFilesAdded]
  );

  // --- DRAG OVER ---
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // --- FILE INPUT handler ---
  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter(isVideoFile);

      if (files.length > 0) {
        await onFilesAdded(
          files.map((f) => Object.assign(f, { createdAt: f.lastModified }))
        );
      } else {
        toast.error("Only video files can be added");
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
              Supported: MP4, MOV, M4V, 3GP, AVI, MTS
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max size: 500MB • AVI not supported in browsers (convert to MP4)
            </p>
          </div>
        </div>
      </label>
    </div>
  );
};
