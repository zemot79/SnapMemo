import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2, Download, Film } from "lucide-react";

import {
  buildTransitionMap,
  ffmpegFilterForTransition,
  TransitionId,
} from "@/lib/transitions";

import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

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
  const ffmpegRef = useRef<any>(null);

  const ensureFFmpeg = async () => {
    if (!ffmpegRef.current) {
      const ffmpeg = createFFmpeg({
        log: true,
        corePath: "/ffmpeg/ffmpeg-core.js",
      });

      ffmpeg.setProgress(({ ratio }) => {
        setExportProgress(Math.round(ratio * 100));
      });

      await ffmpeg.load();
      ffmpegRef.current = ffmpeg;
    }
    return ffmpegRef.current;
  };

  const handleExport = async () => {
    if (items.length === 0) return;

    const ffmpeg = await ensureFFmpeg();
    setLoading(true);
    setExportProgress(0);

    // --------------------------------------------
    // 1) CLIP fájlok betöltése FFmpeg-be
    // --------------------------------------------
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      const source =
        item.file
          ? item.file
          : await (await fetch(item.url || item.thumbnail || "")).blob();

      const uint8data = await fetchFile(source);
      const filename = `clip${i}.mp4`;

      await ffmpeg.FS("writeFile", filename, uint8data);
    }

    // --------------------------------------------
    // 2) Transition lista (buildTransitionMap)
    // --------------------------------------------
    const transitions = buildTransitionMap(
      items,
      selectedTransitions,
      transitionDuration
    );

    // --------------------------------------------
    // 3) Filter chain felépítése
    // --------------------------------------------
    let filterParts: string[] = [];
    let inputFiles: string[] = [];

    items.forEach((_, idx) => {
      inputFiles.push(`-i clip${idx}.mp4`);
    });

    // Példa:
    // "[0][1]xfade=transition=fade:duration=0.5:offset=2[v1];
    //  [v1][2]xfade=transition=slideleft:duration=0.5:offset=4[v2]"
    let chainIdx = 0;
    let previousOut = "";

    for (let i = 0; i < transitions.length; i++) {
      const t = transitions[i];
      const A = i === 0 ? 0 : chainIdx;
      const B = i + 1;

      const filter = ffmpegFilterForTransition(t.transition, t.duration);

      const outName = `v${i + 1}`;

      filterParts.push(
        `[${A}][${B}] ${filter}:offset=1.0 [${outName}]`
      );

      previousOut = outName;
      chainIdx += 1;
    }

    const filterGraph =
      filterParts.length > 0
        ? `-filter_complex "${filterParts.join("; ")}" -map [${
            previousOut || "0"
          }]`
        : `-map 0`; // nincs transition → csak concat

    // --------------------------------------------
    // 4) Export parancs felépítése
    // --------------------------------------------
    const command = [
      ...inputFiles.join(" ").split(" "),
      ...filterGraph.split(" "),
      "-preset",
      "veryfast",
      "output.mp4",
    ];

    // FFmpeg WASM CLI futtatás
    await ffmpeg.run(...command);

    // --------------------------------------------
    // 5) Kimeneti MP4 letöltése
    // --------------------------------------------
    const data = ffmpeg.FS("readFile", "output.mp4");
    const url = URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }));

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
