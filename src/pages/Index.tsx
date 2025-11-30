// --- HERE STARTS THE FULL UPDATED FILE ---
import { useState, useCallback, useRef, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ImageUploader } from "@/components/ImageUploader";
import { VideoUploader } from "@/components/VideoUploader";
import { AudioUploader } from "@/components/AudioUploader";
import type { MediaItem } from "@/components/Timeline";
import { ImageEditor } from "@/components/ImageEditor";
import { VideoEditor } from "@/components/VideoEditor";
import { PreviewPanel, PreviewPanelRef } from "@/components/PreviewPanel";
import { ExportPanel } from "@/components/ExportPanel";
import { VideoTitleStep } from "@/components/VideoTitleStep";
import { Stepper, Step } from "@/components/Stepper";
import { TextOverlayEditor } from "@/components/TextOverlayEditor";
import { ThemeSelector } from "@/components/ThemeSelector";
import { EditStep } from "@/components/EditStep";
import {
  TitleCardCustomizer,
  TitleCardSettings,
} from "@/components/TitleCardCustomizer";
import { Button } from "@/components/ui/button";
import { TitleCardPreview } from "@/components/TitleCardPreview";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import logoImage from "@/assets/logo.png";
import { getThemeById } from "@/lib/themes";
import type { TransitionId } from "@/lib/transitions";
import { Slider } from "@/components/ui/slider";

const getVideoMetadata = (file: File): Promise<{
  duration: number;
  width: number;
  height: number;
  url: string;
}> => {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";

    const onLoaded = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const width = video.videoWidth || 0;
      const height = video.videoHeight || 0;
      resolve({ duration, width, height, url });
    };

    const onError = () => {
      resolve({ duration: 0, width: 0, height: 0, url });
    };

    video.addEventListener("loadedmetadata", onLoaded, { once: true });
    video.addEventListener("error", onError, { once: true });
    video.src = url;
  });
};

const steps: Step[] = [
  { id: 1, title: "Title", description: "Video title" },
  { id: 2, title: "Images", description: "Upload images" },
  { id: 3, title: "Videos", description: "Upload videos" },
  { id: 4, title: "Edit", description: "Timeline" },
  { id: 5, title: "Music", description: "Background music" },
  { id: 6, title: "Preview & Export", description: "View and save" },
];

const DEFAULT_TRANSITIONS: TransitionId[] = ["fade"];
const DEFAULT_TRANSITION_DURATION = 0.4;

const sortMediaItems = (items: MediaItem[]): MediaItem[] => {
  const title = items.filter((i) => i.type === "titleCard");
  const middle = items.filter(
    (i) => i.type !== "titleCard" && i.type !== "logoCard"
  );
  const logo = items.filter((i) => i.type === "logoCard");
  return [...title, ...middle, ...logo];
};

const Index = () => {
  const previewPanelRef = useRef<PreviewPanelRef>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoLocation, setVideoLocation] = useState("");
  const [videoDate, setVideoDate] = useState("");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);

  const [textOverlayItemId, setTextOverlayItemId] = useState<string | null>(
    null
  );
  const [selectedTheme, setSelectedTheme] = useState("classic");
  const [selectedTransitions, setSelectedTransitions] =
    useState<TransitionId[]>(DEFAULT_TRANSITIONS);
  const [transitionDuration, setTransitionDuration] = useState<number>(
    DEFAULT_TRANSITION_DURATION
  );

  const [titleCardSettings, setTitleCardSettings] = useState<TitleCardSettings>(
    {
      titleFontSize: 64,
      titleColor: "#ffffff",
      titleY: 150,
      descriptionFontSize: 36,
      descriptionColor: "#cccccc",
      descriptionY: 300,
      dateFontSize: 28,
      dateColor: "#aaaaaa",
      dateY: 500,
    }
  );

  const [titleCardChangeKey, setTitleCardChangeKey] = useState(0);

  // Title card hossz slider (2–12s)
  const [titleCardDuration, setTitleCardDuration] = useState<number>(4);

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

  // TITLE CARD CREATION LOGIC – PNG létrehozás a 2. lépéshez
  const createTitleCard = useCallback(
    async (
      firstImage: File,
      title: string,
      description: string,
      date: string
    ) => {
      const theme = getThemeById(selectedTheme);

      await document.fonts.ready;

      return new Promise<MediaItem>((resolve) => {
        const canvas = document.createElement("canvas");
        canvas.width = 1920;
        canvas.height = 1080;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          const file = firstImage;
          const thumb = URL.createObjectURL(file);
          resolve({
            id: "title-card",
            file,
            thumbnail: thumb,
            duration: titleCardDuration,
            type: "titleCard",
          } as any);
          return;
        }

        const img = new Image();
        img.onload = () => {
          const imageWidth = canvas.width * (2 / 3);

          const scale = Math.max(
            imageWidth / img.width,
            canvas.height / img.height
          );
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          const x = (imageWidth - scaledWidth) / 2;
          const y = (canvas.height - scaledHeight) / 2;

          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

          if (theme.gradient) {
            const g = ctx.createLinearGradient(
              imageWidth,
              0,
              canvas.width,
              canvas.height
            );
            g.addColorStop(0, theme.colors.background);
            g.addColorStop(1, theme.colors.accent);
            ctx.fillStyle = g;
          } else {
            ctx.fillStyle = theme.colors.background;
          }
          ctx.fillRect(imageWidth, 0, canvas.width - imageWidth, canvas.height);

          const textX = imageWidth + 40;
          const textWidth = canvas.width - imageWidth - 80;

          ctx.fillStyle = theme.colors.primary;
          ctx.font = "bold 64px Arial";
          ctx.textAlign = "left";
          ctx.textBaseline = "top";

          const wrap = (
            text: string,
            maxWidth: number,
            lineHeight: number,
            startY: number
          ) => {
            if (!text) return startY;
            const words = text.split(" ");
            let line = "";
            let y = startY;

            for (let w of words) {
              const test = line + w + " ";
              if (ctx.measureText(test).width > maxWidth) {
                ctx.fillText(line, textX, y);
                line = w + " ";
                y += lineHeight;
              } else {
                line = test;
              }
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
            if (!blob) {
              const file = firstImage;
              const thumb = URL.createObjectURL(file);
              resolve({
                id: "title-card",
                file,
                thumbnail: thumb,
                duration: titleCardDuration,
                type: "titleCard",
              } as any);
              return;
            }

            const file = new File([blob], "title-card.png", {
              type: "image/png",
            });
            const thumb = URL.createObjectURL(blob);
            resolve({
              id: "title-card",
              file,
              thumbnail: thumb,
              duration: titleCardDuration,
              type: "titleCard",
            } as any);
          });
        };

        img.src = URL.createObjectURL(firstImage);
      });
    },
    [selectedTheme, titleCardDuration]
  );

  // AUTO ADD LOGO CARD
  useEffect(() => {
    const hasLogo = mediaItems.some((i) => i.type === "logoCard");
    const hasContent = mediaItems.some(
      (i) => i.type === "image" || i.type === "video"
    );

    if (!hasLogo && hasContent) {
      fetch(logoImage)
        .then((r) => r.blob())
        .then((blob) => {
          const file = new File([blob], "snapmemo-logo.png", {
            type: "image/png",
          });

          setMediaItems((prev) => [
            ...prev,
            {
              id: "logo-end",
              file,
              thumbnail: logoImage,
              duration: 2,
              type: "logoCard",
            } as any,
          ]);
        });
    }
  }, [mediaItems]);

  // IMAGE ADD
  const handleImagesAdded = useCallback(
    async (files: File[]) => {
const newItems: MediaItem[] = files.map((file) => ({
  id: Math.random().toString(36).slice(2),
  file,
  type: "image",
  duration: 3,
  thumbnail: URL.createObjectURL(file),
  createdAt: file.lastModified,
})) as any;

      const hasNoImages =
        mediaItems.filter((i) => i.type === "image").length === 0;

      setMediaItems((prev) => [...prev, ...newItems]);

      if (hasNoImages && videoTitle && files.length > 0) {
        const titleCard = await createTitleCard(
          files[0],
          videoTitle,
          videoDescription,
          videoDate
        );
        setMediaItems((prev) => [titleCard, ...prev]);
      }
    },
    [mediaItems, videoTitle, videoDescription, videoDate, createTitleCard]
  );

  // VIDEO ADD – metaadat
  const handleVideosAdded = useCallback(async (files: File[]) => {
    const metas = await Promise.all(files.map((file) => getVideoMetadata(file)));

    const items = files.map<MediaItem>((file, index) => {
      const meta = metas[index];
      const duration =
        meta.duration && meta.duration > 0 ? meta.duration : undefined;

return {
  id: Math.random().toString(36).slice(2),
  file,
  type: "video",
  duration,
  videoLength: duration,
  width: meta.width || undefined,
  height: meta.height || undefined,
  thumbnail: meta.url,
  url: meta.url,
  clips: [],
  createdAt: file.lastModified,
} as any;
    });

    setMediaItems((prev) => [...prev, ...items]);
  }, []);

  // SEGÉD: rendezett timeline (Title → köztesek → Logo)
  const getOrderedItems = () => sortMediaItems(mediaItems);

  const getImageCount = () =>
    mediaItems.filter((i) => i.type === "image").length;
  const getVideoCount = () =>
    mediaItems.filter((i) => i.type === "video").length;

  const canGoNext = () => {
    if (currentStep === 2 && getImageCount() === 0) return false;
    if (currentStep === 3 && getVideoCount() === 0) return false;
    return currentStep < 6;
  };

  const canGoPrev = () => currentStep > 1;

  // REMOVE ITEM
  const handleRemove = useCallback((id: string) => {
    setMediaItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // REORDER – Title mindig elöl, Logo mindig hátul
  const handleReorder = useCallback((from: number, to: number) => {
    setMediaItems((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);

      const titleIdx = arr.findIndex((i) => i.type === "titleCard");
      if (titleIdx > 0) {
        const [t] = arr.splice(titleIdx, 1);
        arr.unshift(t);
      }

      const logoIdx = arr.findIndex((i) => i.type === "logoCard");
      if (logoIdx !== -1 && logoIdx !== arr.length - 1) {
        const [l] = arr.splice(logoIdx, 1);
        arr.push(l);
      }

      return arr;
    });
  }, []);

  // DURATION CHANGE
  const handleDurationChange = useCallback((id: string, duration: number) => {
    setMediaItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, duration } : i))
    );
  }, []);

  // FOCAL POINT
  const handleFocalPointChange = useCallback((id: string, f: any) => {
    setMediaItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, focalPoint: f } : i))
    );
  }, []);

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
          {/* STEP 1 — TITLE */}
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

          {/* STEP 2 — IMAGES + TITLE CARD PREVIEW + TITLE DURATION SLIDER */}
          {currentStep === 2 && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-bold">Images & Title Card</h2>
                <p className="text-muted-foreground">
                  Upload images and customize your title card
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LEFT */}
                <div className="space-y-6">
                  <ImageUploader onFilesAdded={handleImagesAdded} />

                  {getImageCount() > 0 && (
                    <div className="bg-card rounded-lg border border-border p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">
                          Click images to set focal points
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          💡 Point 1 = Focus | Point 2 = Ken Burns target
                        </p>
                      </div>

                      <ImageEditor
                        images={mediaItems.filter(
                          (i) => i.type === "image"
                        ) as any}
                        onRemove={handleRemove}
                        onFocalPointChange={handleFocalPointChange}
                        onReorder={(from, to) => {
                          const imgs = mediaItems.filter(
                            (i) => i.type === "image"
                          );
                          const all = [...mediaItems];
                          const imageIdx = all
                            .map((i, idx) => (i.type === "image" ? idx : -1))
                            .filter((idx) => idx >= 0);
                          handleReorder(imageIdx[from], imageIdx[to]);
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* RIGHT – TITLE CARD PREVIEW + CUSTOMIZER + DURATION */}
                <div className="space-y-6">
                  <div className="bg-card rounded-lg border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">
                        Title Card Preview
                      </h3>
                      <ThemeSelector
                        selectedTheme={selectedTheme}
                        onThemeChange={(theme) => {
                          setSelectedTheme(theme);
                          setTitleCardChangeKey((k) => k + 1);
                        }}
                      />
                    </div>

                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <TitleCardPreview
                        key={titleCardChangeKey}
                        firstImage={
                          mediaItems.find((i) => i.type === "image")?.file
                        }
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

                  {/* Title Card Duration Slider */}
                  <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold mb-2">
                      Title Card Duration
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Set how long the title card appears at the beginning of
                      your final video.
                    </p>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[titleCardDuration]}
                        min={2}
                        max={12}
                        step={1}
                        onValueChange={(v) =>
                          setTitleCardDuration(v[0] ?? 4)
                        }
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground w-10 text-right">
                        {titleCardDuration}s
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 – VIDEO UPLOAD */}
          {currentStep === 3 && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-bold">Upload Videos</h2>
                <p className="text-muted-foreground">
                  Add videos and select the important clips
                </p>
              </div>

              <VideoUploader onFilesAdded={handleVideosAdded} />

              {getVideoCount() > 0 && (
                <div className="bg-card rounded-lg border border-border p-6">
                  <VideoEditor
                    videos={
                      mediaItems.filter((i) => i.type === "video") as any
                    }
                    onRemove={handleRemove}
                    onClipsChange={(id, c) => {
                      setMediaItems((prev) =>
                        prev.map((i) =>
                          i.id === id ? { ...i, clips: c } : i
                        )
                      );
                    }}
                    onReorder={(from, to) => {
                      const vids = mediaItems.filter(
                        (i) => i.type === "video"
                      );
                      const all = [...mediaItems];
                      const vidIdx = all
                        .map((i, idx) => (i.type === "video" ? idx : -1))
                        .filter((idx) => idx >= 0);
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
              items={getOrderedItems()}
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
              selectedTransitions={selectedTransitions}
              onSelectedTransitionsChange={setSelectedTransitions}
              transitionDuration={transitionDuration}
              onTransitionDurationChange={setTransitionDuration}
              location={videoLocation}
            />
          )}

          {/* STEP 5 – MUSIC */}
          {currentStep === 5 && (
            <div className="max-w-2xl mx-auto space-y-6">
              <AudioUploader
                audios={audioFiles}
                onAudioAdded={(file) =>
                  setAudioFiles((prev) => [...prev, file])
                }
                onAudioRemoved={(i) =>
                  setAudioFiles((prev) =>
                    prev.filter((_, idx) => idx !== i)
                  )
                }
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
                    items={getOrderedItems()}
                    selectedTheme={selectedTheme}
                    selectedTransitions={selectedTransitions}
                    transitionDuration={transitionDuration}
                  />
                </div>

                <div className="lg:col-span-1">
                  <ExportPanel
                    items={getOrderedItems()}
                    selectedTransitions={selectedTransitions}
                    transitionDuration={transitionDuration}
                    titleCardDuration={titleCardDuration}
                  />
                </div>
              </div>
            </div>
          )}

          {/* NAVIGATION */}
          {currentStep > 1 && (
            <div className="flex justify-between max-w-6xl mx-auto mt-8">
              <Button
                onClick={() => setCurrentStep((s) => s - 1)}
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
                  onClick={() => setCurrentStep((s) => s + 1)}
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
      {textOverlayItemId &&
        (() => {
          const item = mediaItems.find((i) => i.id === textOverlayItemId);
          if (!item || !item.file) return null;
          return (
            <TextOverlayEditor
              itemId={item.id}
              itemName={item.file.name}
              overlays={(item as any).textOverlays || []}
              onSave={(o) =>
                setMediaItems((prev) =>
                  prev.map((i) =>
                    i.id === item.id ? { ...i, textOverlays: o } : i
                  )
                )
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
