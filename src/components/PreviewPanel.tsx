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

// ----------------------------------------------------
// Transition class selector (which animation to apply)
// ----------------------------------------------------
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
    case "filmBurn":
      return "animate-filmBurnTransition";
    case "glitch":
      return "animate-glitchTransition";
    default:
      return "";
  }
}

// ----------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------
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

  // ---------------- NORMALIZED CLIP LIST ----------------
  const clips: NormalizedClip[] = useMemo(() => {
    if (!items || !items.length) return [];

    return items.map((item, idx) => {
      let dur =
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
        src = item.url || URL.createObjectURL(item.file);
      } else {
        src =
          item.thumbnail ||
          item.url ||
          (item.file ? URL.createObjectURL(item.file) : "");
      }

      return {
        id: item.id || `clip-${idx}`,
        duration: dur,
        src,
        isVideo,
      };
    });
  }, [items]);

  const totalDuration = useMemo(
    () => clips.reduce((s, c) => s + c.duration, 0),
    [clips]
  );
  const safeTotal = totalDuration || 1;

  // ---------------- CURRENT CLIP LOGIC ----------------
  const { currentIndex, currentClip, clipStartTime, timeInClip } = useMemo(() => {
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
      const dur = clips[i].duration;
      if (globalTime <= acc + dur || i === clips.length - 1) {
        const t = Math.max(0, Math.min(globalTime - acc, dur));
        return {
          currentIndex: i,
          currentClip: clips[i],
          clipStartTime: acc,
          timeInClip: t,
        };
      }
      acc += dur;
    }

    // fallback
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
        const nx = prev + dt;
        return nx >= totalDuration ? totalDuration : nx;
      });

      id = requestAnimationFrame(loop);
    };

    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [isPlaying, clips.length, totalDuration]);

  // ---------------- VIDEO SYNC ----------------
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
      } catch {}
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

  // ---------------- REF EXPOSURE ----------------
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

  // ---------------- TRANSITION TRIGGER ----------------
  useEffect(() => {
    if (!clips.length) return;
    if (currentIndex === lastIndex) return;

    setLastIndex(currentIndex);

    if (selectedTransitions.length === 0) return;

    setIsTransitioning(true);

    const timeout = setTimeout(
      () => setIsTransitioning(false),
      transitionDuration * 1000
    );
    return () => clearTimeout(timeout);
  }, [currentIndex, lastIndex, clips.length, selectedTransitions, transitionDuration]);

  const currentTransition =
    currentIndex > 0 && selectedTransitions.length > 0
      ? selectedTransitions[(currentIndex - 1) % selectedTransitions.length]
      : null;

  // ---------------- SCRUBBERS ----------------
  const scrubClip = (v: number) => {
    if (currentClip) {
      const clamped = Math.max(0, Math.min(v, currentClip.duration));
      setIsPlaying(false);
      setGlobalTime(clipStartTime + clamped);
    }
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

  // ---------------- RENDER MEDIA ----------------
  const renderMedia = () => {
    if (!currentClip) {
      return (
        <div className="flex items-center justify-center w-full h-full text-muted-foreground">
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
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Timeline Preview</h3>
        <button
          onClick={togglePlay}
          className="px-3 py-1 text-xs rounded-full border hover:bg-accent border-border"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>

      {/* TRANSITION LIST */}
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

      {/* MEDIA AREA */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {renderMedia()}

        {/* REAL TRANSITION EFFECT */}
        {isTransitioning && currentTransition && (
          <div
            className={`absolute inset-0 pointer-events-none ${getTransitionClass(
              currentTransition
            )}`}
            style={{
              animationDuration: `${transitionDuration}s`,
            }}
          />
        )}
      </div>

      {/* CLIP SCRUBBER */}
      {currentClip && (
        <div>
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Current Clip</span>
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

      {/* TIMELINE SCRUBBER */}
      {clips.length > 0 && (
        <div>
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Full Video</span>
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

          {/* TIMELINE MARKERS */}
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
