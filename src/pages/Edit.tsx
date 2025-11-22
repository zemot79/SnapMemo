import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import type { MediaItem } from "@/components/Timeline";
import { ClipPreview } from "@/components/Edit/ClipPreview";
import TimelineEditor from "@/components/Edit/TimelineEditor";
import { TextOverlayEditor } from "@/components/Edit/TextOverlayEditor";
import { TransitionsEditor } from "@/components/Edit/TransitionsEditor";
import { ThemesSelector } from "@/components/Edit/ThemesSelector";
import { AiAutoCut } from "@/components/Edit/AiAutoCut";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type TimelineType = "title" | "globe" | "image" | "video" | "outro";

interface TimelineItem {
  id: string;
  type: TimelineType;
  file?: File;
  url?: string;
  duration?: number;
  startTime?: number;
  endTime?: number;
}

// MediaItem-ekből felépítünk egy teljes lejátszási sort:
// Title card → Globe → vágott videó-szegmensek / képek → Outro logo
function buildTimelineFromMedia(mediaItems?: MediaItem[] | null): TimelineItem[] {
  const clips: TimelineItem[] = [];

  if (mediaItems && mediaItems.length > 0) {
    for (const item of mediaItems) {
      if (item.type === "image") {
        clips.push({
          id: item.id,
          type: "image",
          file: item.file,
          url: item.url,
          duration: item.duration ?? 3,
        });
      } else if (item.type === "video") {
        // Ha van VideoEditor klip lista, abból gyártunk szegmenseket
        if (item.clips && item.clips.length > 0) {
          for (const clip of item.clips) {
            clips.push({
              id: `${item.id}-${clip.id}`,
              type: "video",
              file: item.file,
              url: item.url,
              startTime: clip.startTime,
              endTime: clip.endTime,
            });
          }
        } else {
          // Ha nincs klip, az egész videó egyben
          clips.push({
            id: item.id,
            type: "video",
            file: item.file,
            url: item.url,
            startTime: 0,
            endTime: item.duration ?? 30,
          });
        }
      }
    }
  } else {
    // Ha nincs semmi átadva state-ben: demo tartalom
    clips.push(
      { id: "demo-img-1", type: "image", url: "/demo/image1.jpg", duration: 3 },
      { id: "demo-vid-1", type: "video", url: "/demo/video1.mp4", startTime: 0, endTime: 8 }
    );
  }

  return [
    { id: "title-card", type: "title", duration: 2 },
    { id: "globe-intro", type: "globe", duration: 3 },
    ...clips,
    { id: "outro-logo", type: "outro", duration: 2 },
  ];
}

export default function EditPage() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { mediaItems?: MediaItem[] } };

  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>(() =>
    buildTimelineFromMedia(location.state?.mediaItems ?? null)
  );
  const [selectedTheme, setSelectedTheme] = useState<string>("neutral");
  const [selectedTransitions, setSelectedTransitions] = useState<string[]>(["fade"]);
  const [autoCuts, setAutoCuts] = useState<number[]>([]);
  const [activeClipId, setActiveClipId] = useState<string | null>(null);

  // TextOverlayEditor-nek egyszerű klip lista (id, label, type)
  const overlayClips = useMemo(
    () =>
      timelineItems
        .filter((item) => item.type === "image" || item.type === "video")
        .map((item) => ({
          id: item.id,
          label: item.type === "image" ? "Image clip" : "Video clip",
          type: item.type as "image" | "video",
          hasText: false,
        })),
    [timelineItems]
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-background">
      <Header />

      <main className="flex-1 py-6 lg:py-10">
        <div className="max-w-6xl mx-auto px-3 lg:px-6 space-y-6">
          {/* Fejléc */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                Edit project
              </h1>
              <p className="text-sm text-muted-foreground">
                Fine-tune your timeline, text, transitions, themes and AI cuts in one place.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/")}
              >
                Back to builder
              </Button>
            </div>
          </div>

          {/* Két oszlopos layout: bal – Preview + Timeline, jobb – Text / Transitions / AI / Themes */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6 items-start">
            {/* BAL OSZLOP */}
            <div className="space-y-4">
              <ClipPreview
                items={timelineItems}
                onActiveClipChange={setActiveClipId}
              />

              <Card className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold">Timeline</h3>
                    <p className="text-xs text-muted-foreground">
                      Reorder clips and adjust durations.
                    </p>
                  </div>
                </div>

                <TimelineEditor
                  items={timelineItems}
                  onChange={setTimelineItems}
                  onOpenTextEditor={(id) => setActiveClipId(id)}
                  onPreviewRequest={setTimelineItems}
                />
              </Card>
            </div>

            {/* JOBB OSZLOP */}
            <div className="space-y-4">
              <TextOverlayEditor
                clips={overlayClips}
                onEditClipExternal={(id, _text) => {
                  setActiveClipId(id);
                }}
              />

              <TransitionsEditor
                defaultSelected={selectedTransitions}
                onChange={setSelectedTransitions}
              />

              <AiAutoCut
                items={timelineItems}
                onCutsGenerated={(cuts) => setAutoCuts(cuts)}
              />

              <ThemesSelector
                defaultTheme={selectedTheme}
                onChange={setSelectedTheme}
              />

              {autoCuts.length > 0 && (
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">
                    Suggested cut points (sec):{" "}
                    {autoCuts.map((c) => c.toFixed(1)).join(", ")}
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
