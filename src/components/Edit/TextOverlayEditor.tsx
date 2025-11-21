import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlignLeft, ImageIcon, VideoIcon } from "lucide-react";

type OverlayType = "image" | "video";

interface TextOverlayClip {
  id: string;
  label: string;
  type: OverlayType;
  hasText?: boolean;
}

interface TextOverlayEditorProps {
  /**
   * Opcionális: ha kapsz kívülről valódi klip-listát, azt használd.
   * Ha üres vagy undefined, a komponens egy demo-listával dolgozik,
   * hogy önmagában is működjön.
   */
  clips?: TextOverlayClip[];
  /**
   * Ha később rá akarjuk kötni a meglévő ui/TextOverlayEditor.tsx-re,
   * ezen a callbacken keresztül tudjuk meg, melyik klip szövegét
   * kell szerkeszteni.
   */
  onEditClipExternal?: (id: string, text: string) => void;
}

const demoClips: TextOverlayClip[] = [
  { id: "1", label: "Title card", type: "image", hasText: true },
  { id: "2", label: "First video clip", type: "video", hasText: true },
  { id: "3", label: "Family photo", type: "image", hasText: false },
];

export const TextOverlayEditor = ({
  clips,
  onEditClipExternal,
}: TextOverlayEditorProps) => {
  const effectiveClips = useMemo(
    () => (clips && clips.length > 0 ? clips : demoClips),
    [clips]
  );

  const [selectedId, setSelectedId] = useState<string | null>(
    effectiveClips[0]?.id ?? null
  );
  const [text, setText] = useState<string>("");

  const selectedClip = effectiveClips.find((c) => c.id === selectedId) ?? null;

  const handleSave = () => {
    if (!selectedClip) return;
    onEditClipExternal?.(selectedClip.id, text);
    // később itt lehet toast vagy státusz
  };

  return (
    <Card className="p-4 space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlignLeft className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-base font-semibold">Text overlays</h3>
            <p className="text-xs text-muted-foreground">
              Add or edit titles, captions and lower-thirds for each image or
              video.
            </p>
          </div>
        </div>
      </div>

      {/* CLIP LIST */}
      <div className="border rounded-lg max-h-56 overflow-auto">
        {effectiveClips.map((clip) => {
          const Icon = clip.type === "image" ? ImageIcon : VideoIcon;
          const isSelected = clip.id === selectedId;
          return (
            <button
              key={clip.id}
              type="button"
              onClick={() => setSelectedId(clip.id)}
              className={[
                "w-full flex items-center justify-between px-3 py-2 text-left text-sm",
                "hover:bg-muted/70 transition-colors",
                isSelected ? "bg-muted" : "",
              ].join(" ")}
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{clip.label}</span>
              </div>
              {clip.hasText && (
                <span className="text-[10px] uppercase tracking-wide text-primary">
                  has text
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* EDITOR */}
      {selectedClip ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Selected clip
            </span>
            <span className="text-xs">{selectedClip.label}</span>
          </div>

          <Textarea
            rows={4}
            placeholder="Type your title, caption or lower-third text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="flex items-center justify-between gap-2">
            <Input
              type="text"
              placeholder="Optional smaller secondary text…"
              className="text-xs"
            />
            <Button size="sm" onClick={handleSave}>
              Save text
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Select a clip from the list above to edit its text overlay.
        </p>
      )}
    </Card>
  );
};

