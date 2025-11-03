import { useState, useCallback } from "react";
import { FileUploader } from "@/components/FileUploader";
import { Timeline, MediaItem } from "@/components/Timeline";
import { PreviewPanel } from "@/components/PreviewPanel";
import { ExportPanel, ExportSettings } from "@/components/ExportPanel";
import { VideoTitleStep } from "@/components/VideoTitleStep";
import { Stepper, Step } from "@/components/Stepper";
import { Button } from "@/components/ui/button";
import { Film, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const steps: Step[] = [
  { id: 1, title: "Cím", description: "Video címe" },
  { id: 2, title: "Média", description: "Fájlok feltöltése" },
  { id: 3, title: "Szerkesztés", description: "Timeline" },
  { id: 4, title: "Előnézet", description: "Megtekintés" },
  { id: 5, title: "Export", description: "Videó mentése" },
];

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

  const handleTitleNext = useCallback((title: string, description: string) => {
    setVideoTitle(title);
    setVideoDescription(description);
    setCurrentStep(2);
    toast.success("Cím mentve!");
  }, []);

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

  const canGoNext = () => {
    if (currentStep === 2 && mediaItems.length === 0) return false;
    return currentStep < 5;
  };

  const canGoPrev = () => currentStep > 1;

  const handleNext = () => {
    if (canGoNext()) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (canGoPrev()) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg">
              <Film className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Video Mixer Studio
              </h1>
              {videoTitle && (
                <p className="text-sm text-muted-foreground">
                  Projekt: {videoTitle}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6">
        <Stepper steps={steps} currentStep={currentStep} />

        <main className="pb-8">
          {/* Step 1: Video Title */}
          {currentStep === 1 && (
            <VideoTitleStep
              initialTitle={videoTitle}
              initialDescription={videoDescription}
              onNext={handleTitleNext}
            />
          )}

          {/* Step 2: File Upload */}
          {currentStep === 2 && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-bold">Fájlok feltöltése</h2>
                <p className="text-muted-foreground">
                  Adj hozzá képeket és videókat a projekthez
                </p>
              </div>
              <FileUploader onFilesAdded={handleFilesAdded} />
              {mediaItems.length > 0 && (
                <div className="bg-card rounded-lg border border-border p-6">
                  <Timeline
                    items={mediaItems}
                    onRemove={handleRemove}
                    onReorder={handleReorder}
                    onDurationChange={handleDurationChange}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 3: Timeline Editing */}
          {currentStep === 3 && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-bold">Timeline szerkesztés</h2>
                <p className="text-muted-foreground">
                  Rendezd át az elemeket és állítsd be az időtartamokat
                </p>
              </div>
              <div className="bg-card rounded-lg border border-border p-6">
                <Timeline
                  items={mediaItems}
                  onRemove={handleRemove}
                  onReorder={handleReorder}
                  onDurationChange={handleDurationChange}
                />
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {currentStep === 4 && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-bold">Előnézet</h2>
                <p className="text-muted-foreground">
                  Nézd meg, hogyan fog kinézni a videód
                </p>
              </div>
              <PreviewPanel items={mediaItems} />
            </div>
          )}

          {/* Step 5: Export */}
          {currentStep === 5 && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-bold">Export beállítások</h2>
                <p className="text-muted-foreground">
                  Válaszd ki a formátumot és a minőséget
                </p>
              </div>
              <ExportPanel
                onExport={handleExport}
                disabled={mediaItems.length === 0}
              />
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep > 1 && (
            <div className="flex justify-between max-w-6xl mx-auto mt-8">
              <Button
                onClick={handlePrev}
                variant="outline"
                size="lg"
                disabled={!canGoPrev()}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Vissza
              </Button>
              {currentStep < 5 && (
                <Button
                  onClick={handleNext}
                  size="lg"
                  disabled={!canGoNext()}
                  className="gap-2"
                >
                  Tovább
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
