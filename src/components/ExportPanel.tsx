import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Film } from "lucide-react";
import {
  buildTransitionMap,
  ffmpegFilterForTransition,
  TransitionId,
} from "@/lib/transitions";

// ======================================================================
// FFmpeg betöltése CDN-ről – 100% Vercel-biztos
// ======================================================================

let ffmpegReady = false;
let ffmpeg: any = null;
let fetchFile: any = null;
let createFFmpeg: any = null;

async function loadFFmpeg(setExportProgress: (n: number) => void) {
  if (!ffmpegReady) {
    // Betöltjük a CDN-es bundle-t (NINCS import)
    await loadScript(
      "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.8/dist/ffmpeg.min.js"
    );

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

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("FFmpeg script load error"));
    document.body.appendChild(s);
  });
}

// ======================================================================
// EXPORT PANEL
// ======================================================================

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
  const [progress, setProgress] = useState(0);

  const handleExport = async () => {
    if (items.length === 0) return;

    setLoading(true);
    setProgress(0);

    const { ffmpeg, fetchFile } = await loadFFmpeg(setProgress);

    // 1) Input fájlok betöltése
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      let blob: Blob;

      if (item.file) {
        blob = item.file;
      } else {
        const res = await fetch(item.url || item.thumbnail || "");
        blob = await res.blob();
      }

      const data = await fetchFile(blob);
      ffmpeg.FS("writeFile", `clip${i}.mp4`, data);
    }

    // 2) Transition mapping
    const transitions = buildTransitionMap(
      items,
      selectedTransitions,
      transitionDuration
    );

    const filterParts: string[] = [];
    const inputs = items.map((_, i) => `-i clip${i}.mp4`);

    let chainIdx = 0;
    let prev = "";

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

    const command = [
      ...inputs.join(" ").split(" "),
      ...filterGraph.split(" "),
      "-preset",
      "veryfast",
      "output.mp4",
    ];

    await ffmpeg.run(...command);

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
        Render your entire video with transitions and theme effects.
      </p>

      <Button
        disabled={loading}
        onClick={handleExport}
        className="w-full flex items-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin w-4 h-4" />
            Exporting… {progress}%
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
