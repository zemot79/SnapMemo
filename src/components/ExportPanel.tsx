import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Film } from "lucide-react";

import {
  buildTransitionMap,
  ffmpegFilterForTransition,
  TransitionId,
} from "@/lib/transitions";

// =============================================
// SAFE DYNAMIC FFMPEG LOADER (NO BUILD ERRORS)
// =============================================
let ffmpegInstance: any = null;

async function loadFFmpeg(setExportProgress: (n: number) => void) {
  if (!ffmpegInstance) {

    // --- IMPORTANT: BROKEN IMPORT STRING SO VITE CANNOT PARSE ---
    const ffmpegModule = await import(
      /* @vite-ignore */ "@ffmpeg/ffmpeg"
    );

    const createFFmpeg = ffmpegModule.createFFmpeg;
    const fetchFile = ffmpegModule.fetchFile;

    const ffmpeg = createFFmpeg({
      log: false,
      corePath:
        "https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js",
    });

    ffmpeg.setProgress(({ ratio }) => {
      setExportProgress(Math.round(ratio * 100));
    });

    await ffmpeg.load();

    ffmpegInstance = { ffmpeg, fetchFile };
  }

  return ffmpegInstance;
}

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

    // ---- LAZY LOAD FFMPEG (SAFE) ----
    const { ffmpeg, fetchFile } = await loadFFmpeg(setExportProgress);

    // ---- WRITE INPUT FILES ----
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      const blob =
        item.file ??
        (await (await fetch(item.url || item.thumbnail || "")).blob());

      const data = await fetchFile(blob);

      ffmpeg.FS("writeFile", `clip${i}.mp4`, data);
    }

    // ---- BUILD TRANSITION MAP ----
    const transitions = buildTransitionMap(
      items,
      selectedTransitions,
      transitionDuration
    );

    // ---- BUILD FILTER CHAIN ----
    const filterParts: string[] = [];
    const inputArgs = items.map((_, i) => `-i clip${i}.mp4`);

    let prevOut = "";
    let chain = 0;

    for (let i = 0; i < transitions.length; i++) {
      const t = transitions[i];

      const A = i === 0 ? "0" : `v${chain}`;
      const B = `${i + 1}`;

      const filter = ffmpegFilterForTransition(t.transition, t.duration);
      const out = `v${chain + 1}`;

      filterParts.push(`[${A}][${B}] ${filter}:offset=1.0 [${out}]`);
      prevOut = out;
      chain++;
    }

    const filterGraph =
      filterParts.length === 0
        ? `-map 0`
        : `-filter_complex "${filterParts.join("; ")}" -map [${prevOut}]`;

    const command = [
      ...inputArgs.join(" ").split(" "),
      ...filterGraph.split(" "),
      "-preset",
      "veryfast",
      "output.mp4",
    ];

    await ffmpeg.run(...command);

    // ---- DOWNLOAD OUTPUT ----
    const out = ffmpeg.FS("readFile", "output.mp4");
    const url = URL.createObjectURL(
      new Blob([out.buffer], { type: "video/mp4" })
    );

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
        Render your video with transitions.
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
