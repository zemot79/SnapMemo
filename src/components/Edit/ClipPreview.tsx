import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

/**
 * TimelineItem
 * A Preview NEM foglalkozik külön a fájlokkal (FFmpeg majd igen),
 * csak a videók / képek / fixed klip hosszokkal és sorrenddel.
 */
interface TimelineItem {
  id: string;
  type: "title" | "globe" | "image" | "video" | "outro";
  file?: File;
  url?: string;
  duration?: number; // image duration in sec
  startTime?: number; // video trim start
  endTime?: number;   // video trim end
}

interface ClipPreviewProps {
  items: TimelineItem[];
  onActiveClipChange?: (id: string | null) => void;
}

export const ClipPreview = ({ items, onActiveClipChange }: ClipPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [globalTime, setGlobalTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [activeClipId, setActiveClipId] = useState<string | null>(null);

  // ---------------------------------------------------------
  // Compute total duration
  // ---------------------------------------------------------
  useEffect(() => {
    let sum = 0;
    for (const item of items) {
      if (item.type === "image") sum += item.duration ?? 3;
      if (item.type === "video") sum += (item.endTime ?? 0) - (item.startTime ?? 0);
      if (item.type === "title") sum += 2;
      if (item.type === "globe") sum += 3;
      if (item.type === "outro") sum += 2;
    }
    setTotalDuration(sum);
  }, [items]);

  // ---------------------------------------------------------
  // Determine active clip
  // ---------------------------------------------------------
  useEffect(() => {
    let time = 0;
    let active: string | null = null;

    for (const item of items) {
      let clipLength = 0;

      if (item.type === "image") clipLength = item.duration ?? 3;
      if (item.type === "video") clipLength = (item.endTime ?? 0) - (item.startTime ?? 0);
      if (item.type === "title") clipLength = 2;
      if (item.type === "globe") clipLength = 3;
      if (item.type === "outro") clipLength = 2;

      if (globalTime >= time && globalTime < time + clipLength) {
        active = item.id;
        break;
      }
      time += clipLength;
    }

    setActiveClipId(active);
    onActiveClipChange?.(active);
  }, [globalTime, items]);

  // ---------------------------------------------------------
  // Play Loop
  // ---------------------------------------------------------
  useEffect(() => {
    if (!playing) return;

    const tick = () => {
      setGlobalTime((current) => {
        const next = current + 0.1;
        if (next >= totalDuration) {
          // loop
          return 0;
        }
        return next;
      });
      requestAnimationFrame(tick);
    };

    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [playing, totalDuration]);

  // ---------------------------------------------------------
  // Resolve what to show RIGHT NOW
  // ---------------------------------------------------------
  const resolveCurrentFrame = () => {
    let accumulated = 0;

    for (const item of items) {
      let length = 0;
      if (item.type === "image") length = item.duration ?? 3;
      if (item.type === "video") length = (item.endTime ?? 0) - (item.startTime ?? 0);
      if (item.type === "title") length = 2;
      if (item.type === "globe") length = 3;
      if (item.type === "outro") length = 2;

      if (globalTime >= accumulated && globalTime < accumulated + length) {
        const t = globalTime - accumulated;

        // Title card → static image
        if (item.type === "title") {
          return { type: "image", src: "/snapmemo/titlecard.png" };
        }

        // Globe animation placeholder
        if (item.type === "globe") {
          return { type: "video", src: "/animations/globe.mp4", start: 0, time: t };
        }

        // Outro logo
        if (item.type === "outro") {
          return { type: "image", src: "/snapmemo/outro.png" };
        }

        // Image clip
        if (item.type === "image") {
          if (item.file) return { type: "image", src: URL.createObjectURL(item.file) };
          if (item.url) return { type: "image", src: item.url };
        }

        // Video clip
        if (item.type === "video") {
          const start = item.startTime ?? 0;
          const src = item.file
            ? URL.createObjectURL(item.file)
            : item.url ?? "";

          return {
            type: "video",
            src,
            start,
            time: start + t,
          };
        }
      }

      accumulated += length;
    }

    return null;
  };

  const currentFrame = resolveCurrentFrame();

  // ---------------------------------------------------------
  // Handle scrub
  // ---------------------------------------------------------
  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalTime(Number(e.target.value));
  };

  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-base font-semibold">Preview</h3>

      <div className="relative w-full aspect-video bg-black overflow-hidden rounded-lg">
        {/* IMAGE MODE */}
        {currentFrame?.type === "image" && (
          <img
            src={currentFrame.src}
            className="w-full h-full object-cover"
          />
        )}

        {/* VIDEO MODE */}
        {currentFrame?.type === "video" && (
          <video
            ref={videoRef}
            src={currentFrame.src}
            className="w-full h-full object-cover"
            autoPlay
            muted
            onLoadedMetadata={() => {
              if (videoRef.current) {
                videoRef.current.currentTime = currentFrame.time;
              }
            }}
            onTimeUpdate={() => {
              if (videoRef.current && playing) {
                // Keep video synced to global timeline
                const fpsLockedTime = currentFrame.time;
                if (Math.abs(videoRef.current.currentTime - fpsLockedTime) > 0.2) {
                  videoRef.current.currentTime = fpsLockedTime;
                }
              }
            }}
          />
        )}
      </div>

      {/* SCRUBBER */}
      <input
        type="range"
        min={0}
        max={totalDuration}
        step={0.1}
        value={globalTime}
        onChange={handleScrub}
        className="w-full"
      />

      {/* CONTROLS */}
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setGlobalTime(0);
            setPlaying(false);
          }}
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Reset
        </Button>

        <Button
          onClick={() => setPlaying(!playing)}
        >
          {playing ? (
            <>
              <Pause className="w-4 h-4 mr-1" /> Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-1" /> Play
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

