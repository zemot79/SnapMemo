import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useState,
  useMemo,
} from "react";
import { Card } from "@/components/ui/card";

export interface PreviewPanelRef {
  play: () => void;
  pause: () => void;
  startPlayback: () => void;
}

interface PreviewPanelProps {
  items: any[];
  selectedTheme?: string;
  selectedTransitions?: string[];
  transitionDuration?: number;
}

type NormalizedClip = {
  id: string;
  src: string;
  isVideo: boolean;
  duration: number;
};

const FALLBACK_DURATION = 3;

// Melyik transition névhez melyik animáció osztály tartozzon
function getTransitionClass(name?: string | null) {
  switch (name) {
    case "fade":
    case "crossDissolve":
      return "animate-fadeTransition";
    case "slide":
      return "animate-slideTransition";
    case "zoom":
    case "zoomPunch":
      return "animate-zoomTransition";
    case "blur":
    case "blurFade":
      return "animate-blurTransition";
    case "filmBurn":
      return "animate-filmBurnTransition";
    case "glitch":
      return "animate-glitchTransition";
    default:
      return "";
  }
}

const PreviewPanelInner = (
  {
    items,
    selectedTransitions = ["fade"],
    transitionDuration = 0.4,
  }: PreviewPanelProps,
  ref: React.Ref<PreviewPanelRef>
) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [globalTime, setGlobalTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [lastIndex, setLastIndex] = useState(0);

  // --- CLIP NORMALIZÁLÁS ---
  const clips: NormalizedClip[] = useMemo(() => {
    if (!items || !items.length) return [];

    return items.map((item, idx) => {
      let dur: number =
        typeof item.duration === "number"
          ? item.duration
          : typeof item.duration === "string"
          ? parseFloat(item.duration)
          : FALLBACK_DURATION;

      if (!dur || dur <= 0) {
        if (item.type === "titleCard") dur = 4;
        else if (item.type === "logoCard") dur = 2;
        else dur = FALLBACK_DURATION;
      }

      const isVideo = item.type === "video";

      let src = "";
      if (isVideo) {
        if (item.url) src = item.url;
        else if (item.file instanceof File) src = URL.createObjectURL(item.file);
      } else {
        if (item.thumbnail) src = item.thumbnail;
        else if (item.url) src = item.url;
        else if (item.file instanceof File) src = URL.createObjectURL(item.file);
      }

      return {
        id: item.id || `clip-${idx}`,
        src,
        isVideo,
        duration: dur,
      };
    });
  }, [items]);

  const totalDuration = useMemo(
    () => clips.reduce((s, c) => s + c.duration, 0),
    [clips]
  );
  const safeTotal = totalDuration || 1;

  // --- AKTUÁLIS CLIP KIVÁLASZTÁSA ---
  const { currentIndex, currentClip, clipStartTime, timeInClip } = useMemo(() => {
    if (!clips.length) {
      return {
        currentIndex: 0,
        currentClip: null as NormalizedClip | null,
        clipStartTime: 0,
        timeInClip: 0,
      };
    }

    let acc = 0;
    for (let i = 0; i < clips.length; i++) {
      const d = clips[i].duration;
      if (globalTime <= acc + d || i === clips.length - 1) {
        const t = Math.max(0, Math.min(globalTime - acc, d));
        return {
          currentIndex: i,
          currentClip: clips[i],
          clipStartTime: acc,
          timeInClip: t,
        };
      }
      acc += d;
    }

    const last = clips.length - 1;
    const lastClip = clips[last];
    const start = clips.slice(0, last).reduce((s, c) => s + c.duration, 0);
    return {
      currentIndex: last,
      currentClip: lastClip,
      clipStartTime: start,
      timeInClip: lastClip.duration,
    };
  }, [clips, globalTime]);

  // --- LEJÁTSZÁS LOOP ---
  useEffect(() => {
    if (!isPlaying || !clips.length || totalDuration === 0) return;

    let id: number;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;

      setGlobalTime((prev) => {
        if (prev >= totalDuration) {
          setIsPlaying(false);
          return totalDuration;
        }
        const next = prev + dt;
        return next >= totalDuration ? totalDuration : next;
      });

      id = requestAnimationFrame(loop);
    };

    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [isPlaying, clips.length, totalDuration]);

  // --- VIDEO SZINKRONIZÁLÁS ---
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !currentClip) return;

    if (!currentClip.isVideo) {
      if (!vid.paused) vid.pause();
      return;
    }

    const src = currentClip.src;
    const old = vid.getAttribute("data-src");

    const syncTime = () => {
      try {
        const target = Math.min(
          timeInClip,
          Number.isFinite(vid.duration) && vid.duration > 0
            ? vid.duration
            : timeInClip
        );

        if (Math.abs(vid.currentTime - target) > 0.25) {
          vid.currentTime = target;
        }

        if (isPlaying && vid.paused) vid.play().catch(() => {});
        if (!isPlaying && !vid.paused) vid.pause();
      } catch {
        // ignore
      }
    };

    if (src !== old) {
      vid.setAttribute("data-src", src);
      vid.src = src;
      vid.load();
      vid.onloadedmetadata = syncTime;
    } else {
      syncTime();
    }
  }, [currentClip, timeInClip, isPlaying]);

  // --- REF API ---
  useImperativeHandle(ref, () => ({
    play: () => {
      if (totalDuration > 0) setIsPlaying(true);
    },
    pause: () => setIsPlaying(false),
    startPlayback: () => {
      if (totalDuration > 0) {
        setGlobalTime(0);
        setIsPlaying(true);
      }
    },
  }));

  // --- TRANSITION TRIGGER ---
  useEffect(() => {
    if (!clips.length) return;
    if (currentIndex === lastIndex) return;

    setLastIndex(currentIndex);

    if (!selectedTransitions.length) return;

    setIsTransitioning(true);
    const timeout = setTimeout(
      () => setIsTransitioning(false),
      transitionDuration * 1000
    );
    return () => clearTimeout(timeout);
  }, [
    clips.length,
    currentIndex,
    lastIndex,
    selectedTransitions,
    transitionDuration,
  ]);

  const currentTransition =
    currentIndex > 0 && selectedTransitions.length > 0
      ? selectedTransitions[(currentIndex - 1) % selectedTransitions.length]
      : null;

  // --- SCRUBBEREK ---
  const scrubClip = (v: number) => {
    if (!currentClip) return;
    const clamped = Math.max(0, Math.min(v, currentClip.duration));
    setIsPlaying(false);
    setGlobalTime(clipStartTime + clamped);
  };

  const scrubTimeline = (v: number) => {
    const clamped = Math.max(0, Math.min(v, totalDuration));
    setIsPlaying(false);
    setGlobalTime(clamped);
  };

  const togglePlay = () => {
    if (!isPlaying) {
      if (globalTime >= totalDuration - 0.05) setGlobalTime(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  // --- MEDIA RENDER ---
  const renderMedia = () => {
    if (!currentClip) {
      return (
        <div className="flex items-center justify-center w-full h-full text-muted-foreground text-sm">
          Add media to preview.
        </div>
      );
    }

    if (currentClip.isVideo) {
      return (
        <video
          ref={videoRef}
          muted
          preload="metadata"
          className="w-full h-full object-contain bg-black"
        />
      );
    }

    return (
      <img
        src={currentClip.src}
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
          onClick={togglePlay}
          className="px-3 py-1 text-xs rounded-full border border-border hover:bg-accent"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>

      {selectedTransitions.length > 0 && (
        <div className="flex flex-wrap gap-1 text-[10px] text-muted-foreground">
          {selectedTransitions.map((t) => (
            <span
              key={t}
              className="px-2 py-[1px] rounded-full border bg-background"
            >
              {t}
            </span>
          ))}
          <span>{transitionDuration.toFixed(1)}s</span>
        </div>
      )}

      {/* Itt most MINDIG a teljes media-blokk animálódik, nem egy üres overlay */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <div
          className={
            "w-full h-full " +
            (isTransitioning && currentTransition
              ? getTransitionClass(currentTransition)
              : "")
          }
          style={
            isTransitioning && currentTransition
              ? { animationDuration: `${transitionDuration}s` }
              : undefined
          }
        >
          {renderMedia()}
        </div>
      </div>

      {currentClip && (
        <div>
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Current clip</span>
            <span>
              {timeInClip.toFixed(1)} / {currentClip.duration.toFixed(1)}s
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={currentClip.duration}
            step={0.05}
            value={timeInClip}
            onChange={(e) => scrubClip(Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      {clips.length > 0 && (
        <div>
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Full video</span>
            <span>
              {Math.floor(globalTime)} / {Math.floor(totalDuration)}s
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={totalDuration}
            step={0.1}
            value={globalTime}
            onChange={(e) => scrubTimeline(Number(e.target.value))}
            className="w-full"
          />

          {clips.length > 1 && (
            <div className="relative h-4 mt-1">
              {(() => {
                let acc = 0;
                return clips.slice(0, -1).map((clip, idx) => {
                  acc += clip.duration;
                  const left = (acc / safeTotal) * 100;
                  return (
                    <div
                      key={idx}
                      className="absolute top-0 bottom-0 w-[2px] bg-primary/70"
                      style={{ left: `${left}%` }}
                    />
                  );
                });
              })()}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export const PreviewPanel = forwardRef(PreviewPanelInner);
