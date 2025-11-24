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

export default function EditPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const initialMedia = (location.state?.media ?? []) as MediaItem[];
  const [timeline, setTimeline] = useState<MediaItem[]>(initialMedia);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => timeline.find((t) => t.id === selectedId) ?? null,
    [timeline, selectedId]
  );

  const [autoCuts, setAutoCuts] = useState<number[]>([]);

  return (
    <div className="flex flex-col h-screen">
      <Header />

      <main className="flex flex-1 gap-4 px-6 py-4 overflow-hidden">
        {/* Left: Timeline */}
        <div className="w-1/3 overflow-y-auto pr-4">
          <TimelineEditor
            timeline={timeline}
            onChange={setTimeline}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            onPreviewRequest={(updated) => setTimeline(updated)}
          />

          <div className="mt-4">
            <Button
              size="lg"
              className="w-full"
              onClick={() =>
                navigate("/music", {
                  state: { media: timeline }
                })
              }
            >
              Continue to music
            </Button>
          </div>
        </div>

        {/* Middle: Editors */}
        <div className="w-1/3 overflow-y-auto pr-4">
          {selected ? (
            <>
              <TextOverlayEditor
                item={selected}
                onChange={(updated) =>
                  setTimeline((prev) =>
                    prev.map((p) => (p.id === updated.id ? updated : p))
                  )
                }
              />

              <TransitionsEditor
                timeline={timeline}
                onChange={setTimeline}
                selectedId={selectedId}
              />

              <AiAutoCut
                timeline={timeline}
                onCutsDetected={setAutoCuts}
                selectedId={selectedId}
              />
            </>
          ) : (
            <Card className="p-4 text-muted-foreground text-sm">
              Select an item in the timeline to edit text, transitions, effects.
            </Card>
          )}
        </div>

        {/* Right: Preview + Themes */}
        <div className="w-1/3 overflow-y-auto">
          <ClipPreview timeline={timeline} selectedId={selectedId} />

          <ThemesSelector
            timeline={timeline}
            onChange={setTimeline}
            selectedId={selectedId}
          />

          {autoCuts.length > 0 && (
            <Card className="mt-4 p-4">
              <p className="font-medium mb-2">AI Auto-Cut Results</p>
              <p className="text-xs text-muted-foreground">
                Suggested cut points (sec):{" "}
                {autoCuts.map((c) => c.toFixed(1)).join(", ")}
              </p>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
