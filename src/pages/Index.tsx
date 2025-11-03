import { useState, useCallback } from "react";
import { FileUploader } from "@/components/FileUploader";
import { Timeline, MediaItem } from "@/components/Timeline";
import { PreviewPanel } from "@/components/PreviewPanel";
import { ExportPanel, ExportSettings } from "@/components/ExportPanel";
import { Film } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

  const handleFilesAdded = useCallback((files: File[]) => {
    const newItems: MediaItem[] = files.map((file) => {
      const isVideo = file.type.startsWith("video/");
      return {
        id: Math.random().toString(36).substr(2, 9),
        file,
        type: isVideo ? "video" : "image",
        duration: isVideo ? 5 : 3,
        thumbnail: URL.createObjectURL(file),
      };
    });
    setMediaItems((prev) => [...prev, ...newItems]);
  }, []);

  const handleRemove = useCallback((id: string) => {
    setMediaItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("Elem eltávolítva");
  }, []);

  const handleReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      setMediaItems((prev) => {
        const newItems = [...prev];
        const [removed] = newItems.splice(fromIndex, 1);
        newItems.splice(toIndex, 0, removed);
        return newItems;
      });
    },
    []
  );

  const handleDurationChange = useCallback((id: string, duration: number) => {
    setMediaItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, duration } : item))
    );
  }, []);

  const handleExport = useCallback((settings: ExportSettings) => {
    console.log("Exportálás beállításokkal:", settings);
    toast.info("Az exportálás funkció fejlesztés alatt áll");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg">
              <Film className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Video Mixer Studio
              </h1>
              <p className="text-sm text-muted-foreground">
                Professzionális videó összefoglalók készítése
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {mediaItems.length === 0 && <FileUploader onFilesAdded={handleFilesAdded} />}
            
            <PreviewPanel items={mediaItems} />

            <div className="bg-card rounded-lg border border-border p-6">
              <Timeline
                items={mediaItems}
                onRemove={handleRemove}
                onReorder={handleReorder}
                onDurationChange={handleDurationChange}
              />
              {mediaItems.length > 0 && (
                <div className="mt-4">
                  <FileUploader onFilesAdded={handleFilesAdded} />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <ExportPanel
              onExport={handleExport}
              disabled={mediaItems.length === 0}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
