import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useState,
  useMemo,
} from "react";
import { Card } from "@/components/ui/card";
import { TransitionId } from "@/lib/transitions";

export interface PreviewPanelRef {
  play: () => void;
  pause: () => void;
}

interface PreviewPanelProps {
  items: {
    id: string;
    type: string; // "video" | "image" | "titleCard" | "logoCard" | ...
    url?: string;
    thumbnail?: string;
    file?: File;
    duration?: number;
  }[];
  selectedTransitions: TransitionId[]; // most még nem használjuk
  transitionDuration: number;          // most még nem használjuk
}

const FALLBACK_DURATION = 3; // ha nincs duration megadva

export const PreviewPanel = forwardRef<PreviewPanelRef, PreviewPanelProps>(
  ({ items }, ref) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    // Globális idő (másodpercben) a teljes timeline-on
    const [globalTime, setGlobalTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Össz-hossz
    const totalDuration = useMemo(() => {
      if (!items.length) return 0;
      return items.reduce((sum, item) => {
        const d =
          typeof item.duration === "number" && item.duration > 0
            ? item.duration
            : FALLBACK_DURATION;
        return sum + d;
      }, 0);
    }, [items]);

    // Derivált: melyik klipnél tartunk, azon belüli idő
    const {
      currentItem,
      currentIndex,
      timeInClip,
      currentClipDuration,
      offsetBeforeClip,
    } = useMemo(() => {
      if (!items.length || totalDuration === 0) {
        return {
          currentItem: null as any,
          currentIndex: 0,
          timeInClip: 0,
          currentClipDuration: 0,
          offsetBeforeClip: 0,
        };
      }

      let acc = 0;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const d =
          typeof item.duration === "number" && item.duration > 0
            ? item.duration
            : FALLBACK_DURATION;

        if (globalTime <= acc + d || i === items.length - 1) {
          const within = Math.max(0, Math.min(globalTime - acc, d));
          return {
            currentItem: item,
            currentIndex: i,
            timeInClip: within,
            currentClipDuration: d,
            offsetBeforeClip: acc,
          };
        }

        acc += d;
      }

      // fallback
      const last = items[items.length - 1];
      const dLast =
        typeof last.duration === "number" && last.duration > 0
          ? last.duration
          : FALLBACK_DURATION;

      return {
        currentItem: last,
        currentIndex: items.length - 1,
        timeInClip: dLast,
        currentClipDuration: dLast,
        offsetBeforeClip: totalDuration - dLast,
      };
    }, [items, globalTime, totalDuration]);

    // Lejátszás loop – csak a globalTime-ot léptetjük, a többi ebből számolódik
    useEffect(() => {
      if (!isPlaying || totalDuration === 0) return;

      let frameId: number;
      let last = performance.now();

      const loop = (now: number) => {
        const dt = (now - last) / 1000;
        last = now;

        setGlobalTime((prev) => {
          if (prev >= totalDuration) {
            // vége
            setIsPlaying(false);
            return totalDuration;
          }
          const next = prev + dt;
          return next > totalDuration ? totalDuration : next;
        });

        frameId = requestAnimationFrame(loop);
      };

      frameId = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(frameId);
      };
    }, [isPlaying, totalDuration]);

    // Aktuális videó betöltése + időre ugrás
    useEffect(() => {
      if (!currentItem || !videoRef.current) return;

      const isVideo = currentItem.type === "video";

      if (!isVideo) {
        // Képeknél nem használjuk a videót
        videoRef.current.pause();
        return;
      }

      const videoElement = videoRef.current;

      // forrás meghatározása
      const src =
        currentItem.url ||
        currentItem.thumbnail ||
        (currentItem.file ? URL.createObjectURL(currentItem.file) : "");

      if (!src) return;

      const needsNewSrc = videoElement.getAttribute("data-src") !== src;

      if (needsNewSrc) {
        videoElement.setAttribute("data-src", src);
        videoElement.src = src;
        videoElement.load();
        videoElement.onloadedmetadata = () => {
          videoElement.currentTime = Math.min(
            timeInClip,
            videoElement.duration || timeInClip
          );
        };
      } else {
        // csak seek
        try {
          videoElement.currentTime = Math.min(
            timeInClip,
            videoElement.duration || timeInClip
          );
        } catch {
          // ha még nem áll készen, nem baj
        }
      }
    }, [currentItem, timeInClip]);

    // külső vezérlés
    useImperativeHandle(ref, () => ({
      play: () => {
        if (totalDuration === 0) return;
        setIsPlaying(true);
      },
      pause: () => {
        setIsPlaying(false);
      },
    }));

    // Ha új média jön, reseteljük a previewt
    useEffect(() => {
      setGlobalTime(0);
      setIsPlaying(false);
    }, [items.length]);

    const handleClipSliderChange = (value: number) => {
      if (!currentItem) return;
      const clipped = Math.max(
        0,
        Math.min(value, currentClipDuration || FALLBACK_DURATION)
      );
      setIsPlaying(false);
      setGlobalTime(offsetBeforeClip + clipped);
    };

    const handleTimelineSliderChange = (value: number) => {
      const clipped = Math.max(0, Math.min(value, totalDuration || 0));
      setIsPlaying(false);
      setGlobalTime(clipped);
    };

    const renderMedia = () => {
      if (!currentItem) {
        return (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No media to preview
          </div>
        );
      }

      if (currentItem.type === "video") {
        return (
          <video
            ref={videoRef}
            className="w-full h-full object-contain bg-black"
            muted
          />
        );
      }

      // image / titleCard / logoCard stb.
      const src =
        currentItem.thumbnail ||
        currentItem.url ||
        (currentItem.file ? URL.createObjectURL(currentItem.file) : "");

      return (
        <img
          src={src}
          alt="Preview"
          className="w-full h-full object-contain bg-black"
        />
      );
    };

    return (
      <Card className="p-4 lg:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Timeline Preview</h3>
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className="text-xs px-3 py-1 rounded-full border border-border hover:bg-accent"
            disabled={totalDuration === 0}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
        </div>

        {/* Fő preview */}
        <div className="aspect-video rounded-lg overflow-hidden bg-black">
          {renderMedia()}
        </div>

        {/* 1. csúszka – aktuális klip */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Current clip</span>
            <span>
              {timeInClip.toFixed(1)}s / {currentClipDuration.toFixed(1)}s
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={currentClipDuration || FALLBACK_DURATION}
            step={0.05}
            value={currentClipDuration ? timeInClip : 0}
            onChange={(e) => handleClipSliderChange(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* 2. csúszka – teljes timeline */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Full video</span>
            <span>
              {globalTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={totalDuration || 0}
            step={0.1}
            value={globalTime}
            onChange={(e) =>
              handleTimelineSliderChange(Number(e.target.value))
            }
            className="w-full"
          />
        </div>
      </Card>
    );
  }
);

PreviewPanel.displayName = "PreviewPanel";
