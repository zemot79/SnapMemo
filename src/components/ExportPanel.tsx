import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Film } from "lucide-react";
import {
  buildTransitionMap,
  ffmpegFilterForTransition,
  TransitionId,
} from "@/lib/transitions";

// ========================================================================
// 100% Vercel-Biztos FFmpeg Loader — NINCS @ffmpeg/ffmpeg SEHOL
// ========================================================================

let ffmpegReady = false;
let ffmpeg: any = null;
let fetchFile: any = null;

async function loadFFmpeg(setExportProgress: (n: number) => void) {
  if (!ffmpegReady) {
    // 1) Betöltjük a CDN-es bundle-t (NINCS IMPORT)
    await loadScript(
      "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.8/dist/ffmpeg.min.js"
    );

    // FFmpeg a window objektumon lesz elérhető
    const FFmpeg = (window as any).FFmpeg;
    createFFmpeg = FFmpeg.createFFmpeg;
    fetchFile = FFmpeg.fetchFile;

    ffmpeg = createFFmpeg({
      log: true,
      corePath:
        "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.2/dist/ffmpeg-core.js",
    });

    ffmpeg.setProgress(({ ratio }: any) =>
      setExportProgress(Math.round(ratio * 100))
    );

    await ffmpeg.load();
    ffmpegReady = true;
  }

  return { ffmpeg, fetchFile };
}

// Segédfüggvény script betöltéséhez
function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error("Failed loading FFmpeg CDN"));
    document.body.appendChild(el);
  });
}

// ========================================================================
// EXPORT PANEL
// ========================================================================

interface ExportPanelProps {
  items: {
    id: string;
    type: string;
    url?: string;
    thumbnail?: string;
    file?: File;
    duration?: number;
  }[];
  selectedTransitions: TransitionId[];
  transitionDuration: number;
}

export const ExportPanel = ({
  items,
  selectedTransitions,
  transitionDuration,
}: ExportPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleExport = async () => {
    if (items.length === 0) return;

    setLoading(true);
    setExportProgress(0);

    const { ffmpeg, fetchFile } = await loadFFmpeg(setExportProgress);

    // 1) Inputok betöltése
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      const blob =
        item.file ??
        (await (await fetch(item.url || item.thumbnail || "")).blob());

      const data = await fetchFile(blob);
      ffmpeg.FS("writeFile", `clip${i}.mp4`, data);
    }

    // 2) Transition lánc
    const transitions = buildTransitionMap(
      items,
      selectedTransitions,
      transitionDuration
    );

    const filterParts: string[] = [];
    const inputs = items.map((_, i) => `-i clip${i}.mp4`);

    let prev = "";
    let chainIdx = 0;

    for (let i = 0; i < transitions.length; i++) {
      const t = transitions[i];

      const A = i === 0 ? "0" : `v${chainIdx}`;
      const B = `${i + 1}`;

      const filter = ffmpegFilterForTransition(t.transition, t.duration);
      const out = `v${chainIdx + 1}`;

      filterParts.push(`[${A}][${B}] ${filter}:offset=1.0 [${out}]`);

      prev = out;
      chainIdx++;
    }

    const filterGraph =
      filterParts.length === 0
        ? `-map 0`
        : `-filter_complex "${filterParts.join("; ")}" -map [${prev}]`;

    // 3) Futási parancs
    const command = [
      ...inputs.join(" ").split(" "),
      ...filterGraph.split(" "),
      "-preset",
      "veryfast",
      "output.mp4",
    ];

    await ffmpeg.run(...command);

    // 4) Letöltés
    const data = ffmpeg.FS("readFile", "output.mp4");
    const url = URL.createObjectURL(new Blob([data.buffer]));

    const a = document.createElement("a");
    a.href = url;
    a.download = "snapmemo_video.mp4";
    a.click();

    setLoading(false);
  };

  return (
    <Card className="p-6 space-y-5">
      <h3 className="text-xl font-semibold flex items-center gap-2">
        <Film className="w-5 h-5 text-primary" />
        Export Video
      </h3>

      <p className="text-sm text-muted-foreground">
        Render your full video with transitions and theme effects.
      </p>

      <Button
        disabled={loading}
        onClick={handleExport}
        className="w-full flex items-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin w-4 h-4" />
            Exporting… {exportProgress}%
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Render & Download
          </>
        )}
      </Button>
    </Card>
  );
};
