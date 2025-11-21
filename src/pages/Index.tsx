// --- HERE STARTS THE FULL UPDATED FILE ---
import { useState, useCallback, useRef, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ImageUploader } from "@/components/ImageUploader";
import { VideoUploader } from "@/components/VideoUploader";
import { AudioUploader } from "@/components/AudioUploader";
import { Timeline, MediaItem, TextOverlay } from "@/components/Timeline";
import { ImageEditor } from "@/components/ImageEditor";
import { VideoEditor } from "@/components/VideoEditor";
import { PreviewPanel, PreviewPanelRef } from "@/components/PreviewPanel";
import { ExportPanel, ExportSettings } from "@/components/ExportPanel";
import { VideoTitleStep } from "@/components/VideoTitleStep";
import { Stepper, Step } from "@/components/Stepper";
import { TextOverlayEditor } from "@/components/TextOverlayEditor";
import { ThemeSelector } from "@/components/ThemeSelector";
import { EditStep } from "@/components/EditStep";
import { TitleCardCustomizer, TitleCardSettings } from "@/components/TitleCardCustomizer";
import { Button } from "@/components/ui/button";
import { TitleCardPreview } from "@/components/TitleCardPreview";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import logoImage from "@/assets/logo.png";
import { getThemeById } from "@/lib/themes";

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
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [transitions, setTransitions] = useState<string[]>(["fade"]);

  const [textOverlayItemId, setTextOverlayItemId] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState("classic");

  const [titleCardSettings, setTitleCardSettings] = useState<TitleCardSettings>({
    titleFontSize: 64,
    titleColor: "#ffffff",
    titleY: 150,
    descriptionFontSize: 36,
    descriptionColor: "#cccccc",
    descriptionY: 300,
    dateFontSize: 28,
    dateColor: "#aaaaaa",
    dateY: 500,
  });

  const [titleCardChangeKey, setTitleCardChangeKey] = useState(0);

  const handleTitleNext = useCallback(
    (title, description, location, dateFrom, dateTo) => {
      setVideoTitle(title);
      setVideoDescription(description);
      setVideoLocation(location);
      const fullDate = dateTo ? `${dateFrom} - ${dateTo}` : dateFrom;
      setVideoDate(fullDate);
      setCurrentStep(2);
      toast.success("Title saved!");
    },
    []
  );

  // TITLE CARD CREATION LOGIC (unchanged)
  const createTitleCard = useCallback(
    async (firstImage, title, description, date) => {
      const theme = getThemeById(selectedTheme);

      await document.fonts.ready;

      return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        canvas.width = 1920;
        canvas.height = 1080;
        const ctx = canvas.getContext("2d");

        const img = new Image();
        img.onload = () => {
          const imageWidth = canvas.width * (2 / 3);

          const scale = Math.max(imageWidth / img.width, canvas.height / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          const x = (imageWidth - scaledWidth) / 2;
          const y = (canvas.height - scaledHeight) / 2;

          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

          if (theme.gradient) {
            const g = ctx.createLinearGradient(imageWidth, 0, canvas.width, canvas.height);
            g.addColorStop(0, theme.colors.background);
            g.addColorStop(1, theme.colors.accent);
            ctx.fillStyle = g;
          } else ctx.fillStyle = theme.colors.background;

          ctx.fillRect(imageWidth, 0, canvas.width - imageWidth, canvas.height);

          const textX = imageWidth + 40;
          const textWidth = canvas.width - imageWidth - 80;

          ctx.fillStyle = theme.colors.primary;
          ctx.font = "bold 64px Arial";
          ctx.textAlign = "left";
          ctx.textBaseline = "top";

          const wrap = (text, maxWidth, lineHeight, startY) => {
            if (!text) return startY;
            let words = text.split(" ");
            let line = "";
            let y = startY;

            for (let w of words) {
              const test = line + w + " ";
              if (ctx.measureText(test).width > maxWidth) {
                ctx.fillText(line, textX, y);
                line = w + " ";
                y += lineHeight;
              } else line = test;
            }
            ctx.fillText(line, textX, y);
            return y + lineHeight;
          };

          let yPos = 150;
          yPos = wrap(title, textWidth, 80, yPos);

          if (description) {
            yPos += 60;
            ctx.font = "36px Arial";
            ctx.fillStyle = theme.colors.text;
            yPos = wrap(description, textWidth, 50, yPos);
          }

          if (date) {
            yPos += 80;
            ctx.font = "32px Arial";
            ctx.fillStyle = theme.colors.secondary;
            ctx.fillText(date, textX, yPos);
          }

          canvas.toBlob((blob) => {
            const file = new File([blob], "title-card.png", { type: "image/png" });
            const thumb = URL.createObjectURL(blob);
            resolve({
              id: "title-card",
              file,
              thumbnail: thumb,
              duration: 4,
              type: "titleCard",
            });
          });
        };

        img.src = URL.createObjectURL(firstImage);
      });
    },
    [selectedTheme]
  );

  // AUTO ADD LOGO CARD
  useEffect(() => {
    const hasLogo = mediaItems.some((i) => i.type === "logoCard");
    const hasContent = mediaItems.some((i) => i.type === "image" || i.type === "video");

    if (!hasLogo && hasContent) {
      fetch(logoImage)
        .then((r) => r.blob())
        .then((blob) => {
          const file = new File([blob], "snapmemo-logo.png", { type: "image/png" });

          setMediaItems((prev) => [...prev, {
            id: "logo-end",
            file,
            thumbnail: logoImage,
            duration: 2,
            type: "logoCard",
          }]);
        });
    }
  }, [mediaItems]);

  // IMAGE ADD
  const handleImagesAdded = useCallback(
    async (files) => {
      const newItems = files.map((file) => ({
        id: Math.random().toString(36).slice(2),
        file,
        type: "image",
        duration: 3,
        thumbnail: URL.createObjectURL(file),
      }));

      const hasNoImages = mediaItems.filter(i => i.type === "image").length === 0;

      setMediaItems(prev => [...prev, ...newItems]);

      if (hasNoImages && videoTitle && files.length > 0) {
        const titleCard = await createTitleCard(files[0], videoTitle, videoDescription, videoDate);
        setMediaItems(prev => [titleCard, ...prev]);
      }
    },
    [mediaItems, videoTitle, videoDescription, videoDate, createTitleCard]
  );

  // REMOVE ITEM
  const handleRemove = useCallback((id) => {
    setMediaItems(prev => prev.filter(i => i.id !== id));
  }, []);

  // REORDER
  const handleReorder = useCallback((from, to) => {
    setMediaItems(prev => {
      const arr = [...prev];
      const [it] = arr.splice(from, 1);
      arr.splice(to, 0, it);
      return arr;
    });
  }, []);

  // DURATION CHANGE
  const handleDurationChange = useCallback((id, duration) => {
    setMediaItems(prev => prev.map(i => i.id === id ? { ...i, duration } : i));
  }, []);

  // FOCAL POINT
  const handleFocalPointChange = useCallback((id, f) => {
    setMediaItems(prev => prev.map(i => i.id === id ? { ...i, focalPoint: f } : i));
  }, []);

  // VIDEO ADD
const handleVideosAdded = useCallback(async (files: File[]) => {
  const items = files.map<MediaItem>((file) => ({
    id: Math.random().toString(36).slice(2),
    file,
    type: "video",
    // alapértelmezett hossz: 30 mp, ha valamiért nem tudjuk kiolvasni
    duration: undefined,
    // ezt használjuk preview-hoz
    thumbnail: URL.createObjectURL(file),
    clips: [],
  }));
  setMediaItems((prev) => [...prev, ...items]);
}, []);

  // EXPORT
  const calculateTotalDuration = useCallback(() => {
    let total = mediaItems.reduce((t, i) => t + i.duration, 0);
    if (videoLocation) total += 3;
    return total;
  }, [mediaItems, videoLocation]);

  const handleExport = useCallback((settings) => {
    if (previewPanelRef.current)
      previewPanelRef.current.startPlayback();

    return calculateTotalDuration();
  }, [calculateTotalDuration]);

  const getImageCount = () => mediaItems.filter(i => i.type === "image").length;
  const getVideoCount = () => mediaItems.filter(i => i.type === "video").length;

  const canGoNext = () => {
    if (currentStep === 2 && getImageCount() === 0) return false;
    if (currentStep === 3 && getVideoCount() === 0) return false;
    return currentStep < 6;
  };

  const canGoPrev = () => currentStep > 1;

  // ---------------------------
  //           UI
  // ---------------------------

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-6">
        <Stepper
          steps={steps}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
        />

        <main className="pb-8">

          {/* 
          ──────────────────────────────────────────
          STEP 1 — TITLE (Preview removed completely!) 
          ──────────────────────────────────────────
          */}
          {currentStep === 1 && (
            <VideoTitleStep
              initialTitle={videoTitle}
              initialDescription={videoDescription}
              initialLocation={videoLocation}
              initialDate={videoDate}
              onNext={handleTitleNext}
              selectedTheme={selectedTheme}
            />
          )}

          {/* 
          ──────────────────────────────────────────
          STEP 2 — IMAGES + TITLE CARD PREVIEW + CUSTOMIZER
          ──────────────────────────────────────────
          */}
          {currentStep === 2 && (
            <div className="max-w-7xl mx-auto space-y-6">
              
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-bold">Images & Title Card</h2>
                <p className="text-muted-foreground">Upload images and customize your title card</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* LEFT */}
                <div className="space-y-6">

                  <ImageUploader onFilesAdded={handleImagesAdded} />

                  {getImageCount() > 0 && (
                    <div className="bg-card rounded-lg border border-border p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Click images to set focal points</h3>
                        <p className="text-xs text-muted-foreground">
                          💡 Point 1 = Focus | Point 2 = Ken Burns target
                        </p>
                      </div>

                      <ImageEditor
                        images={mediaItems.filter(i => i.type === "image")}
                        onRemove={handleRemove}
                        onFocalPointChange={handleFocalPointChange}
                        onReorder={(from, to) => {
                          const imgs = mediaItems.filter(i => i.type === "image");
                          const all = [...mediaItems];
                          const imageIdx = all.map((i, idx) => i.type === "image" ? idx : -1).filter(idx => idx >= 0);
                          handleReorder(imageIdx[from], imageIdx[to]);
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* RIGHT */}
                <div className="space-y-6">

                  {/* Title Card Preview */}
                  <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold mb-2">Title Card Preview</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This is how your title card will appear
                    </p>

                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                 <TitleCardPreview
  firstImage={mediaItems.find(i => i.type === "image")?.file}
  title={videoTitle}
  description={videoDescription}
  date={videoDate}
  settings={titleCardSettings}
  selectedTheme={selectedTheme}
/>

                    </div>
                  </div>

                  {/* Title Card Customizer */}
                  <TitleCardCustomizer
                    settings={titleCardSettings}
                    onChange={setTitleCardSettings}
                  />
                </div>

              </div>
            </div>
          )}

          {/* STEP 3 – VIDEO UPLOAD */}
          {currentStep === 3 && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-bold">Upload Videos</h2>
                <p className="text-muted-foreground">Add videos and select the important clips</p>
              </div>

              <VideoUploader onFilesAdded={handleVideosAdded} />

              {getVideoCount() > 0 && (
                <div className="bg-card rounded-lg border border-border p-6">
                  <VideoEditor
                    videos={mediaItems.filter(i => i.type === "video")}
                    onRemove={handleRemove}
                    onClipsChange={(id, c) => {
                      setMediaItems(prev => prev.map(i => i.id === id ? { ...i, clips: c } : i));
                    }}
                    onReorder={(from, to) => {
                      const vids = mediaItems.filter(i => i.type === "video");
                      const all = [...mediaItems];
                      const vidIdx = all.map((i, idx) => i.type === "video" ? idx : -1).filter(idx => idx >= 0);
                      handleReorder(vidIdx[from], vidIdx[to]);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 4 – EDIT & TIMELINE */}
          {currentStep === 4 && (
            <EditStep
              items={mediaItems}
              selectedTheme={selectedTheme}
              onThemeChange={setSelectedTheme}
              onRemove={handleRemove}
              onReorder={handleReorder}
              onDurationChange={handleDurationChange}
              onKenBurnsChange={(id, kenBurns) => {
                setMediaItems((prev) =>
                  prev.map((i) => (i.id === id ? { ...i, kenBurns } : i))
                );
              }}
              onTextOverlayClick={(id) => setTextOverlayItemId(id)}
              location={videoLocation}
            />
          )}

          {/* STEP 5 – MUSIC */}
          {currentStep === 5 && (
            <div className="max-w-2xl mx-auto space-y-6">
              <AudioUploader
                audios={audioFiles}
                onAudioAdded={(file) => setAudioFiles(prev => [...prev, file])}
                onAudioRemoved={(i) => setAudioFiles(prev => prev.filter((_, idx) => idx !== i))}
              />
            </div>
          )}

          {/* STEP 6 – PREVIEW & EXPORT */}
          {currentStep === 6 && (
            <div className="max-w-6xl mx-auto space-y-6">

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">Preview and Export</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-2 space-y-4">
                  <PreviewPanel
                    ref={previewPanelRef}
                    items={[
                      ...mediaItems.filter(i => i.type === "titleCard"),
                      ...mediaItems.filter(i => i.type !== "titleCard"),
                    ]}
                    audioFile={audioFiles.length > 0 ? audioFiles[0] : null}
                    transitions={transitions}
                    location={videoLocation}
                    videoTitle={videoTitle}
                    videoDescription={videoDescription}
                    videoDate={videoDate}
                    canvasRef={canvasRef}
                    selectedTheme={selectedTheme}
                    titleCardSettings={titleCardSettings}
                    onTitleCardChange={() => setTitleCardChangeKey(k => k + 1)}
                  />
                </div>

                <div className="lg:col-span-1">
                  <ExportPanel
                    onExport={handleExport}
                    disabled={mediaItems.length === 0}
                    canvasRef={canvasRef}
                    totalDuration={calculateTotalDuration()}
                  />
                </div>

              </div>
            </div>
          )}

          {/* NAVIGATION */}
          {currentStep > 1 && (
            <div className="flex justify-between max-w-6xl mx-auto mt-8">
              <Button
                onClick={() => setCurrentStep(s => s - 1)}
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
                  onClick={() => setCurrentStep(s => s + 1)}
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

      {/* OVERLAY EDITOR */}
      {textOverlayItemId && (() => {
        const item = mediaItems.find(i => i.id === textOverlayItemId);
        if (!item) return null;
        return (
          <TextOverlayEditor
            itemId={item.id}
            itemName={item.file.name}
            overlays={item.textOverlays || []}
            onSave={(o) =>
              setMediaItems(prev => prev.map(i => i.id === item.id ? { ...i, textOverlays: o } : i))
            }
            onClose={() => setTextOverlayItemId(null)}
            selectedTheme={selectedTheme}
          />
        );
      })()}

      <Footer />
    </div>
  );
};

export default Index;

// --- END OF FULL UPDATED FILE ---
