import { useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ThemeSelector } from "@/components/ThemeSelector";
import { Timeline, MediaItem } from "@/components/Timeline";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Play, Sparkles } from "lucide-react";
import { PreviewPanel } from "@/components/PreviewPanel";

type KenBurnsSettings = {
  enabled: boolean;
  effect: "zoomIn" | "zoomOut" | "panLeft" | "panRight";
};

export type TransitionId =
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
  { id: "fade", label: "Fade", description: "Classic transition" },
  { id: "crossDissolve", label: "Cross Dissolve", description: "Soft blend" },
  { id: "dipBlack", label: "Dip to Black", description: "Fade to black" },
  { id: "slide", label: "Slide", description: "Side move" },
  { id: "zoom", label: "Zoom Punch", description: "Quick zoom" },
  { id: "glitch", label: "Glitch", description: "Digital noise" },
  { id: "blur", label: "Blur Fade", description: "Blur + fade" },
  { id: "filmBurn", label: "Film Burn", description: "Retro film burn" },
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

  /** OPTIONAL – safe defaults to avoid crashes */
  selectedTransitions?: TransitionId[];
  onSelectedTransitionsChange?: (ids: TransitionId[]) => void;
  transitionDuration?: number;
  onTransitionDurationChange?: (value: number) => void;

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

  selectedTransitions = ["fade"],
  onSelectedTransitionsChange = () => {},
  transitionDuration = 0.4,
  onTransitionDurationChange = () => {},
}: EditStepProps) => {
  // Remove the duplicated first image if TitleCard exists
const orderedItems = useMemo(() => {
  const first = items.find((i) => i.type === "titleCard");
  const last = items.find((i) => i.type === "logoCard");

  const middle = items
    .filter((i) => i.type !== "titleCard" && i.type !== "logoCard")
    .sort((a, b) => {
      const ca = (a as any).createdAt ?? 0;
      const cb = (b as any).createdAt ?? 0;
      return ca - cb;
    });

  return [
    ...(first ? [first] : []),
    ...middle,
    ...(last ? [last] : []),
  ];
}, [items]);

  const toggleTransition = (id: TransitionId) => {
    const updated = selectedTransitions.includes(id)
      ? selectedTransitions.filter((t) => t !== id)
      : [...selectedTransitions, id];

    onSelectedTransitionsChange(updated);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Edit</h2>
        <p className="text-muted-foreground">Timeline & Transitions</p>
      </div>

      <Tabs defaultValue="media">
        <TabsList className="mx-auto mb-6">
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="text">Text</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
        </TabsList>

        {/* MEDIA TAB */}
        <TabsContent value="media">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT – TIMELINE */}
            <Card>
              <div className="p-4 pb-0">
                <h3 className="text-base font-semibold">Timeline</h3>
                <p className="text-xs text-muted-foreground">
                  Drag media to change order
                </p>
              </div>

              <div className="p-4 pt-0">
                <Timeline
                  items={orderedItems}
                  onRemove={onRemove}
                  onReorder={onReorder}
                  onDurationChange={onDurationChange}
                  onKenBurnsChange={onKenBurnsChange}
                  onTextOverlayClick={onTextOverlayClick}
                />
              </div>
            </Card>

            {/* RIGHT SIDE */}
            <div className="space-y-6">
              {/* Clip Preview */}
              <Card>
                <div className="p-5 pb-0">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Play className="w-4 h-4 text-primary" />
                    Clip Preview
                  </h3>
                </div>

                <div className="p-4">
                  <PreviewPanel
                    items={orderedItems}
                    selectedTheme={selectedTheme}
                    selectedTransitions={selectedTransitions}
                    transitionDuration={transitionDuration}
                  />
                </div>
              </Card>

              <ThemeSelector
                selectedTheme={selectedTheme}
                onThemeChange={onThemeChange}
              />

              {/* TRANSITIONS */}
              <Card>
                <div className="p-4 pb-2">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Transitions
                  </h3>
                </div>

                <div className="px-4 pb-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {AVAILABLE_TRANSITIONS.map((t) => (
                      <label
                        key={t.id}
                        className="flex items-start gap-2 border rounded-md px-3 py-2 text-xs cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedTransitions.includes(t.id)}
                          onCheckedChange={() => toggleTransition(t.id)}
                        />
                        <div>
                          <div className="font-medium">{t.label}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {t.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Duration slider */}
                  <Label className="text-xs">Transition duration</Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[transitionDuration]}
                      min={0.2}
                      max={1}
                      step={0.1}
                      onValueChange={(v) =>
                        onTransitionDurationChange(v[0] ?? 0.4)
                      }
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

        {/* TEXT TAB */}
        <TabsContent value="text">
          <Card className="p-6">Text overlays are edited in the timeline.</Card>
        </TabsContent>

        {/* AUDIO TAB */}
        <TabsContent value="audio">
          <Card className="p-6">Audio settings coming soon…</Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
