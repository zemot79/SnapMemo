import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  AudioWaveform,
  Activity,
  Images,
  Sparkles,
  Settings2,
} from "lucide-react";

interface AiAutoCutProps {
  /**
   * A timeline elem lista, ha később használjuk AI feldolgozásra.
   */
  items?: any[];

  /**
   * Amikor a user rányom az AutoCut-ra,
   * itt adjuk vissza a generált vágási javaslatokat.
   */
  onCutsGenerated?: (cuts: number[]) => void;
}

export const AiAutoCut = ({ items = [], onCutsGenerated }: AiAutoCutProps) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [strength, setStrength] = useState<"low" | "medium" | "high">("medium");
  const [loading, setLoading] = useState(false);

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((x) => x !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);

    // 🔥 Itt majd AI / ML / FFmpeg logika fut
    // Most dummy adatot adunk vissza a preview-hoz.
    setTimeout(() => {
      const dummyCuts = [1.3, 3.1, 7.8, 12.0, 15.4]; // másodpercek
      onCutsGenerated?.(dummyCuts);
      setLoading(false);
    }, 1200);
  };

  return (
    <Card className="p-4 space-y-4">
      {/* HEADER */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <div>
          <h3 className="text-base font-semibold">AI Auto-Cut</h3>
          <p className="text-xs text-muted-foreground">
            Let the AI help find the best cutting points in your video.
          </p>
        </div>
      </div>

      {/* AI MODES */}
      <div className="space-y-3">
        {/* Beat detection */}
        <label
          onClick={() => toggle("beat")}
          className="flex items-start gap-3 border p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition select-none"
        >
          <Checkbox
            checked={selected.includes("beat")}
            onCheckedChange={() => toggle("beat")}
          />
          <div>
            <div className="flex items-center gap-2">
              <AudioWaveform className="w-4 h-4 text-blue-400" />
              <span className="font-medium text-sm">Beat detection</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Cut aligned with the rhythm of the background music.
            </p>
          </div>
        </label>

        {/* Motion detection */}
        <label
          onClick={() => toggle("motion")}
          className="flex items-start gap-3 border p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition select-none"
        >
          <Checkbox
            checked={selected.includes("motion")}
            onCheckedChange={() => toggle("motion")}
          />
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="font-medium text-sm">Motion detection</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Detect strong movement changes and cut precisely on action.
            </p>
          </div>
        </label>

        {/* Scene detection */}
        <label
          onClick={() => toggle("scene")}
          className="flex items-start gap-3 border p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition select-none"
        >
          <Checkbox
            checked={selected.includes("scene")}
            onCheckedChange={() => toggle("scene")}
          />
          <div>
            <div className="flex items-center gap-2">
              <Images className="w-4 h-4 text-purple-400" />
              <span className="font-medium text-sm">Scene detection</span>
            </div>
            <p className="text-xs text-muted-foreground">
              AI detects big visual changes between scenes.
            </p>
          </div>
        </label>
      </div>

      {/* STRENGTH */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Settings2 className="w-4 h-4 text-muted-foreground" />
          Detection Strength
        </div>

        <div className="flex gap-2">
          {(["low", "medium", "high"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={strength === s ? "default" : "outline"}
              onClick={() => setStrength(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* GENERATE */}
      <Button
        className="w-full"
        onClick={handleGenerate}
        disabled={selected.length === 0 || loading}
      >
        {loading ? "Analyzing…" : "Generate cuts"}
      </Button>
    </Card>
  );
};

