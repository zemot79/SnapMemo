import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Film } from "lucide-react";
import {
  buildTransitionMap,
  ffmpegFilterForTransition,
  TransitionId,
} from "@/lib/transitions";

type ResolutionPreset = "1080p" | "720p" | "480p";
type Orientation = "landscape" | "vertical" | "square";

function getDimensions(resolution: ResolutionPreset, orientation: Orientation) {
  let height: number;
  switch (resolution) {
    case "720p":
      height = 720;
      break;
    case "480p":
      height = 480;
      break;
    case "1080p":
    default:
      height = 1080;
      break;
  }

  let width: number;
  switch (orientation) {
    case "vertical":
      width = Math.round((9 / 16) * height);
      break;
    case "square":
      width = height;
      break;
    case "landscape":
    default:
      width = Math.round((16 / 9) * height);
      break;
  }

  return { width, height };
}

// ======================================================================
// FFmpeg betöltése CDN-ről – Vercel-biztos, nincs import("@ffmpeg/ffmpeg")
// ======================================================================

let ffmpegReady = false;
let ffmpeg: any = null;
let fetchFile: any = null;
let createFFmpeg: any = null;

async function loadFFmpeg(setExportProgress: (n: number) => void) {
  if (!ffmpegReady) {
    await loadScript(
      "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.8/dist/ffmpeg.min.js"
    );

    const FFmpeg = (window as any).FFmpeg;
    if (!FFmpeg) {
      throw new Error("FFmpeg global not found");
    }

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
    document.head.appendChild(s);
  });
}

// ======================================================================
// ExportPanel típusok
// ======================================================================

export interface ExportItem {
  id: string;
  type: "title" | "image" | "video" | "logo";
  url?: string;
  thumbnail?: string;
  file?: File;
  duration?: number;
}

export interface ExportSettings {
  // helyet hagyunk későbbi extra beállításoknak
}

interface ExportPanelProps {
  items: ExportItem[];
  selectedTransitions: TransitionId[];
  transitionDuration: number;
  titleCardDuration: number;
}

// ======================================================================
// ExportPanel komponens
// ======================================================================

export const ExportPanel = ({
  items,
  selectedTransitions,
  transitionDuration,
  titleCardDuration,
}: ExportPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resolution, setResolution] = useState<ResolutionPreset>("1080p");
  const [orientation, setOrientation] = useState<Orientation>("landscape");
  const { width, height } = getDimensions(resolution, orientation);

  const handleExport = async () => {
    if (!items || items.length === 0) return;

    setLoading(true);
    setProgress(0);

    const { ffmpeg, fetchFile } = await loadFFmpeg(setProgress);

    // --- 1) Sorrend felépítése: Title -> Videók -> Logo ---
    const titleItem = items.find((i) => i.type === "title");
    const logoItem = items.find((i) => i.type === "logo");
    const videoItems = items.filter((i) => i.type === "video");

    type Scene = {
      kind: "title" | "video" | "logo";
      item: ExportItem;
      duration: number;
    };

    const scenes: Scene[] = [];

    if (titleItem) {
      scenes.push({
        kind: "title",
        item: titleItem,
        duration: Math.max(2, Math.min(12, titleCardDuration || 4)),
      });
    }

    for (const v of videoItems) {
      const d = v.duration && v.duration > 0 ? v.duration : 3;
      scenes.push({
        kind: "video",
        item: v,
        duration: d,
      });
    }

    if (logoItem) {
      scenes.push({
        kind: "logo",
        item: logoItem,
        duration: 2, // fix 2 mp
      });
    }

    if (scenes.length === 0) {
      setLoading(false);
      return;
    }

    // Transition input lista: csak a videók + képek ID-i
    const pseudoForTransitions = scenes.map((s, index) => ({
      id: s.item.id || `scene-${index}`,
      duration: s.duration,
      type: s.item.type,
    })) as any[];

    const transitions = buildTransitionMap(
      pseudoForTransitions,
      selectedTransitions,
      transitionDuration
    );

    const scaleFilter = `scale=${width}:${height}:force_original_aspect_ratio=cover,setsar=1:1`;

    // --- 2) Fájlok előkészítése: minden scene -> clip{i}.mp4 ---
    for (let index = 0; index < scenes.length; index++) {
      const scene = scenes[index];
      const fileName = `clip${index}.mp4`;

      if (scene.kind === "video") {
        const item = scene.item;

        let blob: Blob;

        if (item.file) {
          blob = item.file;
        } else {
          const res = await fetch(item.url || item.thumbnail || "");
          blob = await res.blob();
        }

        const data = await fetchFile(blob);
        const inputName = `src${index}.mp4`;
        ffmpeg.FS("writeFile", inputName, data);

        await ffmpeg.run(
          "-i",
          inputName,
          "-vf",
          scaleFilter,
          "-preset",
          "veryfast",
          fileName
        );
      } else {
        // title / logo -> kép -> MP4
        const imgItem = scene.item;

        let blob: Blob;
        if (imgItem.file) {
          blob = imgItem.file;
        } else {
          const res = await fetch(imgItem.url || imgItem.thumbnail || "");
          blob = await res.blob();
        }

        const data = await fetchFile(blob);
        const imgName = `img${index}.png`;
        ffmpeg.FS("writeFile", imgName, data);

        await ffmpeg.run(
          "-loop",
          "1",
          "-t",
          String(scene.duration),
          "-i",
          imgName,
          "-vf",
          scaleFilter,
          "-preset",
          "veryfast",
          fileName
        );
      }
    }

    // --- 3) Transition lánc felépítése ---
    const inputs = scenes.map((_, i) => `-i clip${i}.mp4`);

    const filterParts: string[] = [];
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
        Render and download your final video, including title & logo cards.
      </p>

      {/* ÚJ: aktív transition lista az export panelben is */}
      {selectedTransitions && selectedTransitions.length > 0 && (
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Transitions in export:</div>
          <div className="flex flex-wrap gap-1">
            {selectedTransitions.map((t) => (
              <span
                key={t}
                className="px-2 py-[2px] rounded-full border bg-background text-[11px]"
              >
                {t}
              </span>
            ))}
            <span className="ml-1 text-[11px]">
              Duration: {transitionDuration.toFixed(1)}s
            </span>
          </div>
        </div>
      )}

      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Orientation</span>
          <select
            className="border rounded px-2 py-1 bg-background text-foreground text-xs"
            value={orientation}
            onChange={(e) => setOrientation(e.target.value as Orientation)}
            disabled={loading}
          >
            <option value="landscape">Landscape 16:9</option>
            <option value="vertical">Vertical 9:16</option>
            <option value="square">Square 1:1</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Resolution</span>
          <select
            className="border rounded px-2 py-1 bg-background text-foreground text-xs"
            value={resolution}
            onChange={(e) => setResolution(e.target.value as ResolutionPreset)}
            disabled={loading}
          >
            <option value="1080p">High (1080p)</option>
            <option value="720p">Medium (720p)</option>
            <option value="480p">Small (480p)</option>
          </select>
        </div>
        <p className="text-xs text-muted-foreground">
          Output size: {width} × {height}px
        </p>
      </div>

      <Button
        disabled={loading || items.length === 0}
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
