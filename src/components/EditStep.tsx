import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ThemeSelector } from "@/components/ThemeSelector";
import { Timeline, MediaItem } from "@/components/Timeline";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Play,
  Sparkles,
  Type,
  Music,
  Shuffle,
  Wand2,
} from "lucide-react";

type KenBurnsSettings = {
  enabled: boolean;
  effect: "zoomIn" | "zoomOut" | "panLeft" | "panRight";
};

type TransitionId =
  | "fade"
  | "crossDissolve"
  | "dipBlack"
  | "slide"
  | "zoom"
  | "glitch"
  | "blur"
  | "filmBurn";

const AVAILABLE_TRANSITIONS: {
  id: TransitionId;
  label: string;
  description: string;
}[] = [
  { id: "fade", label: "Fade", description: "Classic smooth dissolve between clips" },
  { id: "crossDissolve", label: "Cross dissolve", description: "Video editor standard cross fade" },
  { id: "dipBlack", label: "Dip to black", description: "Quick fade to black between scenes" },
  { id: "slide", label: "Slide", description: "Modern horizontal slide transition" },
  { id: "zoom", label: "Zoom punch", description: "Fast punch-in zoom effect" },
  { id: "glitch", label: "Glitch", description: "Edgy digital glitch effect" },
  { id: "blur", label: "Blur fade", description: "Quick blur + fade combo" },
  { id: "filmBurn", label: "Film burn", description: "Retro light-leak style burn" },
];

interface EditStepProps {
  items: MediaItem[];
  selectedTheme: string;
  onThemeChange: (themeId: string) => void;
  onRemove: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onDurationChange: (id: string, duration: number) => void;
  onKenBurnsChange?: (id: string, kenBurns: KenBurnsSettings) => void;
  onTextOverlayClick?: (id: string) => void;
  location?: string;
}

export const EditStep = ({
  items,
  selectedTheme,
  onThemeChange,
  onRemove,
  onReorder,
  onDurationChange,
  onKenBurnsChange,
  onTextOverlayClick,
}: EditStepProps) => {
  const [selectedTransitions, setSelectedTransitions] = useState<TransitionId[]>(["fade"]);
  const [transitionDuration, setTransitionDuration] = useState<number>(0.4);

  // NEW: selected clip state for Clip Preview
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  // WIDE PREVIEW: selects current clip OR fallback to first video/image
  const previewItem = useMemo(() => {
    if (!items.length) return null;

    if (selectedClipId) {
      return items.find((i) => i.id === selectedClipId) || null;
    }

    const videoItem = items.find((i) => i.type === "video");
    if (videoItem) return videoItem;

    const imgItem = items.find((i) => i.type === "image");
    if (imgItem) return imgItem;

    return items[0];
  }, [items, selectedClipId]);

  const toggleTransition = (id: TransitionId) => {
    setSelectedTransitions((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold">Edit</h2>
        <p className="text-muted-foreground">Adjust media, text, and audio settings.</p>
      </div>

      <Tabs defaultValue="media" className="w-full">

        {/* TAB HEADERS */}
        <TabsList className="mx-auto mb-4 w-fit">
          <TabsTrigger value="media" className="px-6">Media</TabsTrigger>
          <TabsTrigger value="text" className="px-6">Text</TabsTrigger>
          <TabsTrigger value="audio" className="px-6">Audio</TabsTrigger>
        </TabsList>

        {/* ---------------- MEDIA TAB ---------------- */}
        <TabsContent value="media" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

            {/* ---- TIMELINE ---- */}
            <div
              className="space-y-6"
              onClickCapture={(e) => {
                const id = (e.target as HTMLElement)?.closest("[data-id]")?.getAttribute("data-id");
                if (id) setSelectedClipId(id);
              }}
            >
              <Card className="border-border">
                <div className="p-4 pb-0">
                  <h3 className="text-base font-semibold">Timeline</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Drag to reorder, change durations, open text overlays.
                  </p>
                </div>
                <div className="p-4 pt-0">
                  <Timeline
                    items={items}
                    onRemove={onRemove}
                    onReorder={onReorder}
                    onDurationChange={onDurationChange}
                    onKenBurnsChange={onKenBurnsChange}
                    onTextOverlayClick={onTextOverlayClick}
                  />
                </div>
              </Card>
            </div>

            {/* ---- RIGHT SIDE ---- */}
            <div className="space-y-6">

              {/* -------- CLIP PREVIEW: FULL WIDTH -------- */}
              <Card className="border-border">
                <div className="p-5 pb-0">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Play className="w-4 h-4 text-primary" />
                    Clip Preview
                  </h3>
                </div>

                <div className="p-4">
                  {previewItem ? (
                    <div className="aspect-video rounded-lg overflow-hidden w-full bg-black">
                      {previewItem.type === "video" ? (
                        <video
                          src={previewItem.url || previewItem.thumbnail}
                          className="w-full h-full object-contain"
                          controls
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={previewItem.thumbnail}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="aspect-video flex items-center justify-center bg-muted rounded-lg">
                      No preview available
                    </div>
                  )}
                </div>
              </Card>

              {/* -------- THEME SELECTOR -------- */}
              <ThemeSelector selectedTheme={selectedTheme} onThemeChange={onThemeChange} />

              {/* -------- TRANSITIONS -------- */}
              <Card className="border-border">
                <div className="p-4 pb-2">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Transitions
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Choose transitions to randomize between clips.
                  </p>
                </div>

                <div className="px-4 pb-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {AVAILABLE_TRANSITIONS.map((t) => (
                      <label
                        key={t.id}
                        className="flex items-start gap-2 rounded-md border border-border px-2 py-2 text-xs cursor-pointer hover:border-primary/60"
                      >
                        <Checkbox
                          checked={selectedTransitions.includes(t.id)}
                          onCheckedChange={() => toggleTransition(t.id)}
                          className="mt-0.5"
                        />
                        <span>
                          <div className="font-medium">{t.label}</div>
                          <div className="text-[11px] text-muted-foreground">{t.description}</div>
                        </span>
                      </label>
                    ))}
                  </div>

                  <Label className="text-xs">Transition duration</Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[transitionDuration]}
                      min={0.2}
                      max={1}
                      step={0.1}
                      onValueChange={(v) => setTransitionDuration(v[0] ?? 0.4)}
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground w-10 text-right">
                      {transitionDuration.toFixed(1)}s
                    </span>
                  </div>
                </div>
              </Card>

            </div>
          </div>
        </TabsContent>

        {/* ---------------- TEXT TAB ---------------- */}
        <TabsContent value="text">
          <Card className="p-6 space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Type className="w-4 h-4 text-primary" />
              Text Overlays
            </h3>
            <p className="text-sm text-muted-foreground">
              Open text overlay editor inside the timeline.
            </p>
          </Card>
        </TabsContent>

        {/* ---------------- AUDIO TAB ---------------- */}
        <TabsContent value="audio">
          <Card className="p-6 space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Music className="w-4 h-4 text-primary" />
              Background Music
            </h3>
            <p className="text-sm text-muted-foreground">Audio settings coming soon.</p>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};
