import { useState, useCallback, useRef } from "react";
import { ImageUploader } from "@/components/ImageUploader";
import { VideoUploader } from "@/components/VideoUploader";
import { AudioUploader } from "@/components/AudioUploader";
import { Timeline, MediaItem } from "@/components/Timeline";
import { ImageEditor } from "@/components/ImageEditor";
import { VideoEditor } from "@/components/VideoEditor";
import { PreviewPanel, PreviewPanelRef } from "@/components/PreviewPanel";
import { ExportPanel, ExportSettings } from "@/components/ExportPanel";
import { VideoTitleStep } from "@/components/VideoTitleStep";
import { Stepper, Step } from "@/components/Stepper";
import { Button } from "@/components/ui/button";
import { Film, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const steps: Step[] = [
  { id: 1, title: "Title", description: "Video title" },
  { id: 2, title: "Images", description: "Upload images" },
  { id: 3, title: "Videos", description: "Upload videos" },
  { id: 4, title: "Edit", description: "Timeline" },
  { id: 5, title: "Music", description: "Background music" },
  { id: 6, title: "Preview & Export", description: "View and save" },
];

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewPanelRef = useRef<PreviewPanelRef>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoLocation, setVideoLocation] = useState("");
  const [videoDate, setVideoDate] = useState("");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [transitions, setTransitions] = useState<string[]>(["fade"]);

  const handleTitleNext = useCallback((title: string, description: string, location: string, dateFrom: string, dateTo: string) => {
    setVideoTitle(title);
    setVideoDescription(description);
    setVideoLocation(location);
    const fullDate = dateTo ? `${dateFrom} - ${dateTo}` : dateFrom;
    setVideoDate(fullDate);
    setCurrentStep(2);
    toast.success("Title saved!");
  }, []);

  const handleImagesAdded = useCallback((files: File[]) => {
    const newItems: MediaItem[] = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      type: "image" as const,
      duration: 3,
      thumbnail: URL.createObjectURL(file),
    }));
    setMediaItems((prev) => {
      const combined = [...prev, ...newItems];
      // Sort by file creation time (lastModified)
      return combined.sort((a, b) => a.file.lastModified - b.file.lastModified);
    });
    toast.success(`${files.length} images added and sorted chronologically`);
  }, []);

  const handleVideosAdded = useCallback((files: File[]) => {
    const newItems: MediaItem[] = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      type: "video" as const,
      duration: 5,
      thumbnail: URL.createObjectURL(file),
      clips: [],
    }));
    setMediaItems((prev) => {
      const combined = [...prev, ...newItems];
      // Sort by file creation time (lastModified)
      return combined.sort((a, b) => a.file.lastModified - b.file.lastModified);
    });
    toast.success(`${files.length} videos added and sorted chronologically`);
  }, []);

  const handleRemove = useCallback((id: string) => {
    setMediaItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("Item removed");
  }, []);

  const handleReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      setMediaItems((prev) => {
        const newItems = [...prev];
        const [removed] = newItems.splice(fromIndex, 1);
        newItems.splice(toIndex, 0, removed);
        return newItems;
      });
      toast.success("Item reordered");
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
      toast.success("Focal point set");
    },
    []
  );

  const handleClipsChange = useCallback(
    (id: string, clips: { id: string; startTime: number; endTime: number }[]) => {
      setMediaItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const totalDuration = clips.reduce(
            (acc, clip) => acc + (clip.endTime - clip.startTime),
            0
          );
          return { ...item, clips, duration: totalDuration };
        })
      );
    },
    []
  );

  const handleExport = useCallback((settings: ExportSettings): number => {
    console.log("Exportálás beállításokkal:", settings);
    
    // Calculate total duration from all media items
    const totalDuration = mediaItems.reduce((total, item) => total + item.duration, 0);
    
    // Start playback
    if (previewPanelRef.current) {
      previewPanelRef.current.startPlayback();
    }
    
    toast.info(`Video recording starting... (${Math.ceil(totalDuration)} sec)`);
    
    return totalDuration;
  }, [mediaItems]);

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
                  Project: {videoTitle}
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
              initialLocation={videoLocation}
              initialDate={videoDate}
              onNext={handleTitleNext}
            />
          )}

          {/* Step 2: Image Upload */}
          {currentStep === 2 && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-bold">Upload Images</h2>
                <p className="text-muted-foreground">
                  Add images and mark the main focal point
                </p>
                {getImageCount() > 0 && (
                  <p className="text-sm text-primary font-medium">
                    {getImageCount()} images added
                  </p>
                )}
              </div>
              <ImageUploader onFilesAdded={handleImagesAdded} />
              {getImageCount() > 0 && (
                  <div className="bg-card rounded-lg border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      Click on images to set focal point
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      💡 Drag elements to reorder
                    </p>
                  </div>
                  <ImageEditor
                    images={mediaItems.filter((item) => item.type === "image")}
                    onRemove={handleRemove}
                    onFocalPointChange={handleFocalPointChange}
                    onReorder={(from, to) => {
                      const images = mediaItems.filter(item => item.type === "image");
                      const allItems = [...mediaItems];
                      const imageIndices = allItems.map((item, idx) => item.type === "image" ? idx : -1).filter(idx => idx >= 0);
                      
                      const actualFrom = imageIndices[from];
                      const actualTo = imageIndices[to];
                      
                      handleReorder(actualFrom, actualTo);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 3: Video Upload */}
          {currentStep === 3 && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-bold">Upload Videos</h2>
                <p className="text-muted-foreground">
                  Add videos and select the important clips
                </p>
                {getVideoCount() > 0 && (
                  <p className="text-sm text-accent font-medium">
                    {getVideoCount()} videos added
                  </p>
                )}
              </div>
              <VideoUploader onFilesAdded={handleVideosAdded} />
              {getVideoCount() > 0 && (
                  <div className="bg-card rounded-lg border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      Set the time ranges for important clips
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      💡 Drag elements to reorder
                    </p>
                  </div>
                  <VideoEditor
                    videos={mediaItems.filter((item) => item.type === "video")}
                    onRemove={handleRemove}
                    onClipsChange={handleClipsChange}
                    onReorder={(from, to) => {
                      const videos = mediaItems.filter(item => item.type === "video");
                      const allItems = [...mediaItems];
                      const videoIndices = allItems.map((item, idx) => item.type === "video" ? idx : -1).filter(idx => idx >= 0);
                      
                      const actualFrom = videoIndices[from];
                      const actualTo = videoIndices[to];
                      
                      handleReorder(actualFrom, actualTo);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 4: Timeline Editing */}
          {currentStep === 4 && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-bold">Timeline Editing</h2>
                <p className="text-muted-foreground">
                  Reorder elements and set durations
                </p>
                <div className="flex gap-4 justify-center text-sm">
                  <span className="text-primary font-medium">
                    {getImageCount()} images
                  </span>
                  <span className="text-accent font-medium">
                    {getVideoCount()} videos
                  </span>
                </div>
              </div>
              
              {/* Timeline Section */}
              <div className="bg-card rounded-lg border border-border p-6">
                <Timeline
                  items={mediaItems}
                  onRemove={handleRemove}
                  onReorder={handleReorder}
                  onDurationChange={handleDurationChange}
                />
              </div>

              {/* Transitions Section */}
              <div className="bg-card rounded-lg border border-border p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>
                    </div>
                    <h3 className="text-lg font-semibold">Transitions</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Select the transition types you want to use in the video. They will appear in random order.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { id: "fade", name: "Fade" },
                      { id: "slideLeft", name: "Slide Left" },
                      { id: "slideRight", name: "Slide Right" },
                      { id: "zoomIn", name: "Zoom In" },
                      { id: "zoomOut", name: "Zoom Out" },
                      { id: "wipe", name: "Wipe" },
                    ].map((transition) => (
                      <div
                        key={transition.id}
                        className="flex items-center space-x-2 p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                      >
                        <input
                          type="checkbox"
                          id={`transition-${transition.id}`}
                          checked={transitions.includes(transition.id)}
                          onChange={() => {
                            const newTransitions = transitions.includes(transition.id)
                              ? transitions.filter((t) => t !== transition.id)
                              : [...transitions, transition.id];
                            setTransitions(newTransitions);
                          }}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <label
                          htmlFor={`transition-${transition.id}`}
                          className="text-sm font-medium leading-none cursor-pointer flex-1"
                        >
                          {transition.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Audio Upload */}
          {currentStep === 5 && (
            <div className="max-w-2xl mx-auto space-y-6">
              <AudioUploader
                audios={audioFiles}
                onAudioAdded={(file) => setAudioFiles(prev => [...prev, file])}
                onAudioRemoved={(index) => setAudioFiles(prev => prev.filter((_, i) => i !== index))}
              />
            </div>
          )}

          {/* Step 6: Preview & Export */}
          {currentStep === 6 && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-bold">Preview and Export</h2>
                <p className="text-muted-foreground">
                  View the video and download it
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <PreviewPanel 
                    ref={previewPanelRef}
                    items={mediaItems} 
                    audioFile={audioFiles.length > 0 ? audioFiles[0] : null}
                    transitions={transitions}
                    location={videoLocation}
                    videoTitle={videoTitle}
                    videoDescription={videoDescription}
                    videoDate={videoDate}
                    canvasRef={canvasRef}
                  />
                </div>
                
                <div className="lg:col-span-1">
                  <ExportPanel
                    onExport={handleExport}
                    disabled={mediaItems.length === 0}
                    canvasRef={canvasRef}
                  />
                </div>
              </div>
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
                Back
              </Button>
              {currentStep < 6 && (
                <Button
                  onClick={handleNext}
                  size="lg"
                  disabled={!canGoNext()}
                  className="gap-2"
                >
                  Next
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
