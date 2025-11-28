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

// --------------------------------------------
// Transition CSS class selector
// --------------------------------------------
function getTransitionClass(name?: string | null) {
  switch (name) {
    case "fade":
    case "crossDissolve":
      return "animate-fadeTransition";
    case "slide":
      return "animate-slideTransition";
    case "zoom":
      return "animate-zoomTransition";
    case "blur":
      return "animate-blurTransition";
    case "glitch":
      return "animate-glitchTransition";
    case "filmBurn":
      return "animate-filmBurnTransition";
    default:
      return "";
  }
}

// --------------------------------------------
// PANEL
// --------------------------------------------
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

  // Transition state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [lastIndex, setLastIndex] = useState(0);

  // ---------------- NORMALIZÁLT CLIP LISTA ----------------
  const clips: NormalizedClip[] = useMemo(() => {
    if (!items || !items.length) return [];

    return items.map((item, index) => {
      let dur =
        typeof item.duration === "number"
          ? item.duration
          : typeof item.duration === "string"
          ? parseFloat(item.duration)
          : undefined;

      if (!Number.isFinite(dur!) || dur! <= 0) {
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
        id: item.id || `clip-${index}`,
        src,
        isVideo,
        duration: dur!,
      };
    });
  }, [items]);

  const totalDuration = useMemo(
    () => clips.reduce((sum, c) => sum + c.duration, 0),
    [clips]
  );
  const safeTotal = totalDuration || 1;

  // ---------------- CURRENT CLIP ----------------
  const {
    currentIndex,
    currentClip,
    clipStartTime,
    timeInClip,
  } = useMemo(() => {
    if (!clips.length) {
      return {
        currentIndex: 0,
        currentClip: null,
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
    const clip = clips[last];
    const start = clips.slice(0, last).reduce((s, c) => s + c.duration, 0);

    return {
      currentIndex: last,
      currentClip: clip,
      clipStartTime: start,
      timeInClip: clip.duration,
    };
  }, [clips, globalTime]);

  // ---------------- PLAYBACK LOOP ----------------
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
        return next > totalDuration ? totalDuration : next;
      });

      id = requestAnimationFrame(loop);
    };

    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [isPlaying, clips.length, totalDuration]);

  // ---------------- VIDEO SZINKRON ----------------
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !currentClip) return;

    if (!currentClip.isVideo) {
      if (!v.paused) v.pause();
      return;
    }

    const src = currentClip.src;
    const old = v.getAttribute("data-src");

    const playSync = () => {
      try {
        const target = Math.min(
          timeInClip,
          Number.isFinite(v.duration) && v.duration > 0 ? v.duration : timeInClip
        );

        if (Math.abs(v.currentTime - target) > 0.3) {
          v.currentTime = target;
        }

        if (isPlaying && v.paused) v.play().catch(() => {});
        if (!isPlaying && !v.paused) v.pause();
      } catch {}
    };

    if (src !== old) {
      v.setAttribute("data-src", src);
      v.src = src;
      v.load();
      v.onloadedmetadata = playSync;
    } else {
      playSync();
    }
  }, [currentClip, timeInClip, isPlaying]);

  // ---------------- REF FUNKCIÓK ----------------
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

  // ---------------- TRANSITION DETECTION ----------------
  useEffect(() => {
    if (!clips.length) return;
    if (currentIndex === lastIndex) return;

    setLastIndex(currentIndex);

    if (selectedTransitions.length === 0) return;

    setIsTransitioning(true);

    const timeout = setTimeout(() => {
      setIsTransitioning(false);
    }, transitionDuration * 1000);

    return () => clearTimeout(timeout);
  }, [
    currentIndex,
    lastIndex,
    clips.length,
    selectedTransitions,
    transitionDuration,
  ]);

  const currentTransition =
    currentIndex > 0 && selectedTransitions.length > 0
      ? selectedTransitions[(currentIndex - 1) % selectedTransitions.length]
      : null;

  // ---------------- SCRUBBERS ----------------
  const handleClipScrub = (v: number) => {
    if (!currentClip) return;
    const clipped = Math.max(0, Math.min(v, currentClip.duration));
    setIsPlaying(false);
    setGlobalTime(clipStartTime + clipped);
  };

  const handleTimelineScrub = (v: number) => {
    const clipped = Math.max(0, Math.min(v, totalDuration));
    setIsPlaying(false);
    setGlobalTime(clipped);
  };

  const togglePlay = () => {
    if (!isPlaying) {
      if (globalTime >= totalDuration - 0.05) {
        setGlobalTime(0);
      }
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  // ---------------- UI RENDER ----------------
  const renderMedia = () => {
    if (!currentClip) {
      return (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
          Add media to preview.
        </div>
      );
    }

    if (currentClip.isVideo) {
      return (
        <video
          ref={videoRef}
          className="w-full h-full object-contain bg-black"
          muted
          preload="metadata"
        />
      );
    }

    return (
      <img
        src={currentClip.src}
        className="w-full h-full object-contain bg-black"
        alt="Preview"
      />
    );
  };

  return (
    <Card className="p-4 lg:p-5 space-y-4">

      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Timeline Preview</h3>
        <button
          onClick={togglePlay}
          className="text-xs px-3 py-1 rounded-full border hover:bg-accent border-border"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>

      {/* Transition lista */}
      {selectedTransitions.length > 0 && (
        <div className="flex flex-wrap gap-1 text-[10px] text-muted-foreground">
          {selectedTransitions.map((t) => (
            <span
              key={t}
              className="px-2 py-[1px] border rounded-full bg-background"
            >
              {t}
            </span>
          ))}
          <span>{transitionDuration.toFixed(1)}s</span>
        </div>
      )}

      {/* MEDIA AREA */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {renderMedia()}

        {/* Transition overlay – igazi effekt */}
        {isTransitioning && currentTransition && (
          <div
            className={`absolute inset-0 pointer-events-none ${getTransitionClass(
              currentTransition
            )}`}
            style={{ ["--tw-duration" as any]: `${transitionDuration}s` }}
          />
        )}
      </div>

      {/* CURRENT CLIP SCRUBBER */}
      {currentClip && (
        <div className="space-y-1">
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
            onChange={(e) => handleClipScrub(Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      {/* FULL TIMELINE SCRUBBER */}
      {clips.length > 0 && (
        <div className="space-y-1">
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
            onChange={(e) => handleTimelineScrub(Number(e.target.value))}
            className="w-full"
          />

          {/* Transition marks */}
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
