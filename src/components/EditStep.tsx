import { useMemo, useState } from "react";
import { Timeline, MediaItem } from "@/components/Timeline";
import { ThemeSelector } from "@/components/ThemeSelector";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Play, Sparkles, Wand2, Type, Shuffle } from "lucide-react";

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

const AVAILABLE_TRANSITIONS: { id: TransitionId; label: string; description: string }[] = [
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

/**
 * EditStep – új 2 oszlopos Edit UI a Timeline köré építve
 * Bal: timeline + sorrend
 * Jobb: clip preview, themes, transitions, text overlays, AI smart cut (egyelőre csak UI)
 */
export const EditStep = ({
  items,
  selectedTheme,
  onThemeChange,
  onRemove,
  onReorder,
  onDurationChange,
  onKenBurnsChange,
  onTextOverlayClick,
  location,
}: EditStepProps) => {
  const [selectedTransitions, setSelectedTransitions] = useState<TransitionId[]>(["fade"]);
  const [transitionDuration, setTransitionDuration] = useState<number>(0.4);

  // Egyszerű clip preview: első video, ha nincs, akkor első kép
  const previewItem = useMemo(() => {
    if (items.length === 0) return null;
    const videoItem = items.find((i) => i.type === "video");
    if (videoItem) return videoItem;
    const imageItem = items.find((i) => i.type === "image");
    if (imageItem) return imageItem;
    return items[0];
  }, [items]);

  const toggleTransition = (id: TransitionId) => {
    setSelectedTransitions((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleRandomizeTransitions = () => {
    // Itt csak a UI készül, a tényleges random transition kiosztást
    // később kötjük rá a render / export logikára.
    // A kiválasztott transition ID-ket és az időtartamot már eltároljuk state-ben.
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold">Edit & Timeline</h2>
        <p className="text-muted-foreground">
          Reorder clips, adjust durations, set text, transitions and style.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.8fr,1.4fr] gap-8 items-start">
        {/* BAL – TIMELINE + SORREND */}
        <div className="space-y-6">
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
                location={location}
              />
            </div>
          </Card>
        </div>

        {/* JOBB – PREVIEW + VEZÉRLŐK */}
        <div className="space-y-4">
          {/* Clip Preview – legfelül, ahogy kérted */}
          <Card className="border-border">
            <div className="p-4 pb-0 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <Play className="w-4 h-4 text-primary" />
                  Clip preview
                </h3>
                <p className="text-xs text-muted-foreground">
                  Quick look at the first video or image in your timeline.
                </p>
              </div>
            </div>
            <div className="p-4">
              {previewItem ? (
                <div className="aspect-video rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                  {previewItem.type === "video" ? (
                    <video
                      src={previewItem.thumbnail || (previewItem as any).url}
                      className="w-full h-full object-cover"
                      controls
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={previewItem.thumbnail}
                      alt={previewItem.file?.name || "Preview"}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ) : (
                <div className="aspect-video rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                  Add images or videos to see a preview.
                </div>
              )}
            </div>
          </Card>

          {/* Themes – a meglévő ThemeSelector komponenssel */}
          <ThemeSelector selectedTheme={selectedTheme} onThemeChange={onThemeChange} />

          {/* Transitions – multi-pick + random, globális */}
          <Card className="border-border">
            <div className="p-4 pb-2 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Transitions
                </h3>
                <p className="text-xs text-muted-foreground">
                  Choose one or more transition styles – they&apos;ll be randomized between clips.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleRandomizeTransitions}
              >
                <Shuffle className="w-4 h-4" />
              </Button>
            </div>
            <div className="px-4 pb-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Active transition types</Label>
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
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Transition duration (seconds)</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[transitionDuration]}
                    min={0.2}
                    max={1}
                    step={0.1}
                    onValueChange={(vals) => setTransitionDuration(vals[0] ?? 0.4)}
                    className="flex-1"
                  />
                  <span className="text-xs tabular-nums text-muted-foreground w-10 text-right">
                    {transitionDuration.toFixed(1)}s
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Text overlays – itt csak segítség, a tényleges edit a timeline-on lévő gombból nyílik */}
          <Card className="border-border">
            <div className="p-4 space-y-1">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Type className="w-4 h-4 text-primary" />
                Text overlays
              </h3>
              <p className="text-xs text-muted-foreground">
                Open the text editor for any clip directly from the timeline using the &quot;Text&quot; button.
              </p>
            </div>
          </Card>

          {/* AI Smart Cut – most még csak UI, logika később */}
          <Card className="border-border">
            <div className="p-4 space-y-2">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-primary" />
                AI Smart Cut (coming soon)
              </h3>
              <p className="text-xs text-muted-foreground">
                Automatically find the best moments and suggest clip cut points. This panel prepares the UI –
                the underlying detection logic will be wired to the render engine in a later step.
              </p>
              <Button size="sm" variant="outline" disabled className="mt-1">
                Analyze timeline (disabled in this version)
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
