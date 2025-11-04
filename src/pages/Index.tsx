import { useState, useCallback } from "react";
import { ImageUploader } from "@/components/ImageUploader";
import { VideoUploader } from "@/components/VideoUploader";
import { Timeline, MediaItem } from "@/components/Timeline";
import { ImageEditor } from "@/components/ImageEditor";
import { PreviewPanel } from "@/components/PreviewPanel";
import { ExportPanel, ExportSettings } from "@/components/ExportPanel";
import { VideoTitleStep } from "@/components/VideoTitleStep";
import { Stepper, Step } from "@/components/Stepper";
import { Button } from "@/components/ui/button";
import { Film, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const steps: Step[] = [
  { id: 1, title: "Cím", description: "Video címe" },
  { id: 2, title: "Képek", description: "Képek feltöltése" },
  { id: 3, title: "Videók", description: "Videók feltöltése" },
  { id: 4, title: "Szerkesztés", description: "Timeline" },
  { id: 5, title: "Előnézet", description: "Megtekintés" },
  { id: 6, title: "Export", description: "Videó mentése" },
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

  const handleImagesAdded = useCallback((files: File[]) => {
    const newItems: MediaItem[] = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      type: "image" as const,
      duration: 3,
      thumbnail: URL.createObjectURL(file),
    }));
    setMediaItems((prev) => [...prev, ...newItems]);
  }, []);

  const handleVideosAdded = useCallback((files: File[]) => {
    const newItems: MediaItem[] = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      type: "video" as const,
      duration: 5,
      thumbnail: URL.createObjectURL(file),
    }));
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

  const handleFocalPointChange = useCallback(
    (id: string, focalPoint: { x: number; y: number }) => {
      setMediaItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, focalPoint } : item))
      );
      toast.success("Fókuszpont beállítva");
    },
    []
  );

  const handleExport = useCallback((settings: ExportSettings) => {
    console.log("Exportálás beállításokkal:", settings);
    toast.info("Az exportálás funkció fejlesztés alatt áll");
  }, []);

  const getImageCount = () => mediaItems.filter((item) => item.type === "image").length;
  const getVideoCount = () => mediaItems.filter((item) => item.type === "video").length;

  const canGoNext = () => {
    if (currentStep === 2 && getImageCount() === 0) return false;
    if (currentStep === 3 && getVideoCount() === 0) return false;
    return currentStep < 6;
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

          {/* Step 2: Image Upload */}
          {currentStep === 2 && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-bold">Képek feltöltése</h2>
                <p className="text-muted-foreground">
                  Adj hozzá képeket és jelöld ki a főbb téma helyét
                </p>
                {getImageCount() > 0 && (
                  <p className="text-sm text-primary font-medium">
                    {getImageCount()} kép hozzáadva
                  </p>
                )}
              </div>
              <ImageUploader onFilesAdded={handleImagesAdded} />
              {getImageCount() > 0 && (
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Kattints a képekre a fókuszpont megadásához
                  </h3>
                  <ImageEditor
                    images={mediaItems.filter((item) => item.type === "image")}
                    onRemove={handleRemove}
                    onFocalPointChange={handleFocalPointChange}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 3: Video Upload */}
          {currentStep === 3 && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-bold">Videók feltöltése</h2>
                <p className="text-muted-foreground">
                  Adj hozzá videókat a projektedhez
                </p>
                {getVideoCount() > 0 && (
                  <p className="text-sm text-accent font-medium">
                    {getVideoCount()} videó hozzáadva
                  </p>
                )}
              </div>
              <VideoUploader onFilesAdded={handleVideosAdded} />
              {getVideoCount() > 0 && (
                <div className="bg-card rounded-lg border border-border p-6">
                  <Timeline
                    items={mediaItems.filter((item) => item.type === "video")}
                    onRemove={handleRemove}
                    onReorder={handleReorder}
                    onDurationChange={handleDurationChange}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 4: Timeline Editing */}
          {currentStep === 4 && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-bold">Timeline szerkesztés</h2>
                <p className="text-muted-foreground">
                  Rendezd át az elemeket és állítsd be az időtartamokat
                </p>
                <div className="flex gap-4 justify-center text-sm">
                  <span className="text-primary font-medium">
                    {getImageCount()} kép
                  </span>
                  <span className="text-accent font-medium">
                    {getVideoCount()} videó
                  </span>
                </div>
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

          {/* Step 5: Preview */}
          {currentStep === 5 && (
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

          {/* Step 6: Export */}
          {currentStep === 6 && (
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
              {currentStep < 6 && (
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
