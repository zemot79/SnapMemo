import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useState,
  useMemo,
} from "react";
import { Card } from "@/components/ui/card";

// Ez az a ref, amit az Index.tsx használ (startPlayback-kel együtt)
export interface PreviewPanelRef {
  play: () => void;
  pause: () => void;
  startPlayback: () => void;
}

// A props-ok úgy, ahogy az Index.tsx-ből jönnek – a többségét most sem használjuk,
// csak azért tesszük ide, hogy ne törjön semmi.
interface PreviewPanelProps {
  items: any[];
  audioFile?: File | null;
  transitions?: string[];
  location?: string;
  videoTitle?: string;
  videoDescription?: string;
  videoDate?: string;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  selectedTheme?: string;
  titleCardSettings?: any;
  onTitleCardChange?: () => void;

  // ÚJ: transition preview-hez
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

const PreviewPanelInner = (
  {
    items,
    selectedTransitions,
    transitionDuration = 0.4,
  }: PreviewPanelProps,
  ref: React.Ref<PreviewPanelRef>
) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // globális idő a teljes timeline-on
  const [globalTime, setGlobalTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // animációs overlay-hez
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [lastIndex, setLastIndex] = useState(0);

  // ---------------- TIMELINE NORMALIZÁLÁS ----------------

  const clips: NormalizedClip[] = useMemo(() => {
    if (!items || !items.length) return [];

    return items.map((item, index) => {
      // duration kiszedése: lehet number vagy string
      let dur: number | undefined =
        typeof item.duration === "number"
          ? item.duration
          : typeof item.duration === "string"
          ? parseFloat(item.duration)
          : undefined;

      if (!Number.isFinite(dur!) || (dur ?? 0) <= 0) {
        if (item.type === "titleCard") dur = 4;
        else if (item.type === "logoCard") dur = 2;
        else dur = FALLBACK_DURATION;
      }

      const isVideo = item.type === "video";

      let src = "";
      if (isVideo) {
        if (item.url) src = item.url;
        else if (item.file instanceof File) {
          src = URL.createObjectURL(item.file);
        }
      } else {
        if (item.thumbnail) src = item.thumbnail;
        else if (item.url) src = item.url;
        else if (item.file instanceof File) {
          src = URL.createObjectURL(item.file);
        }
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

  // ---------------- CURRENT CLIP + OFFSET ----------------

  const {
    currentIndex,
    currentClip,
    clipStartTime,
    timeInClip,
  } = useMemo(() => {
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

    const lastIndex = clips.length - 1;
    const lastClip = clips[lastIndex];
    const start =
      clips.slice(0, lastIndex).reduce((s, c) => s + c.duration, 0) || 0;

    return {
      currentIndex: lastIndex,
      currentClip: lastClip,
      clipStartTime: start,
      timeInClip: lastClip.duration,
    };
  }, [clips, globalTime]);

  // ---------------- LEJÁTSZÁS LOOP ----------------

  useEffect(() => {
    if (!isPlaying || !clips.length || totalDuration === 0) return;

    let frameId: number;
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

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, clips.length, totalDuration]);

  // ---------------- VIDEO SZINKRONIZÁLÁS ----------------

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentClip) return;

    if (!currentClip.isVideo) {
      // képnél csak pauza
      if (!video.paused) video.pause();
      return;
    }

    const src = currentClip.src;
    if (!src) return;

    const curSrc = video.getAttribute("data-src");

    const setTimeAndPlay = () => {
      try {
        const targetTime = Math.min(
          timeInClip,
          Number.isFinite(video.duration) && video.duration > 0
            ? video.duration
            : timeInClip
        );
        if (Math.abs(video.currentTime - targetTime) > 0.3) {
          video.currentTime = targetTime;
        }
        if (isPlaying && video.paused) {
          video.play().catch(() => {});
        }
        if (!isPlaying && !video.paused) {
          video.pause();
        }
      } catch {
        // ignore
      }
    };

    if (curSrc !== src) {
      video.setAttribute("data-src", src);
      video.src = src;
      video.load();
      video.onloadedmetadata = () => {
        setTimeAndPlay();
      };
    } else {
      setTimeAndPlay();
    }
  }, [currentClip, timeInClip, isPlaying]);

  // ---------------- REF METÓDUSOK ----------------

  useImperativeHandle(ref, () => ({
    play: () => {
      if (totalDuration === 0) return;
      setIsPlaying(true);
    },
    pause: () => {
      setIsPlaying(false);
    },
    startPlayback: () => {
      if (totalDuration === 0) return;
      setGlobalTime(0);
      setIsPlaying(true);
    },
  }));

  // Ha új média jön → reset
  useEffect(() => {
    setGlobalTime(0);
    setIsPlaying(false);
  }, [clips.length]);

  // ---------------- TRANSITION ANIMÁCIÓ ----------------

  useEffect(() => {
    if (!clips.length) return;
    if (currentIndex === lastIndex) return;

    setLastIndex(currentIndex);

    if (!selectedTransitions || selectedTransitions.length === 0) return;

    setIsTransitioning(true);
    const timeout = window.setTimeout(() => {
      setIsTransitioning(false);
    }, (transitionDuration ?? 0.4) * 1000);

    return () => window.clearTimeout(timeout);
  }, [
    currentIndex,
    clips.length,
    lastIndex,
    selectedTransitions,
    transitionDuration,
  ]);

  const currentTransitionName =
    selectedTransitions &&
    selectedTransitions.length > 0 &&
    currentIndex > 0
      ? selectedTransitions[(currentIndex - 1) % selectedTransitions.length]
      : null;

  // ---------------- SLIDEREK ----------------

  const handleClipScrub = (value: number) => {
    if (!currentClip) return;
    const clipped = Math.max(0, Math.min(value, currentClip.duration));
    setIsPlaying(false);
    setGlobalTime(clipStartTime + clipped);
  };

  const handleTimelineScrub = (value: number) => {
    const clipped = Math.max(0, Math.min(value, totalDuration || 0));
    setIsPlaying(false);
    setGlobalTime(clipped);
  };

  const togglePlay = () => {
    if (!isPlaying) {
      // ha a végén állunk, menjünk vissza az elejére
      if (globalTime >= totalDuration - 0.01) {
        setGlobalTime(0);
      }
      if (totalDuration > 0) setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  // ---------------- HELPER IDŐ FORMÁZÁS ----------------

  const formatTime = (sec: number) => {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, "0")}`;
  };

  // ---------------- RENDER ----------------

  const renderMedia = () => {
    if (!currentClip) {
      return (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
          Add media to preview your video.
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
        alt="Preview"
        className="w-full h-full object-contain bg-black"
      />
    );
  };

  const currentClipDuration = currentClip?.duration ?? 0;

  return (
    <Card className="p-4 lg:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Timeline Preview</h3>
        <button
          type="button"
          onClick={togglePlay}
          className="text-xs px-3 py-1 rounded-full border border-border hover:bg-accent"
          disabled={!clips.length || totalDuration === 0}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>

      {/* Transition lista – 6. lépésen is látszik */}
      {selectedTransitions && selectedTransitions.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
          {selectedTransitions.map((t) => (
            <span
              key={t}
              className="px-2 py-[1px] rounded-full border bg-background"
            >
              {t}
            </span>
          ))}
          <span className="ml-1">
            {(transitionDuration ?? 0.4).toFixed(1)}s
          </span>
        </div>
      )}

      {/* FŐ ELŐNÉZET + overlay */}
      <div className="aspect-video rounded-lg overflow-hidden bg-black relative">
        {renderMedia()}
        {isTransitioning && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black/40 transition-opacity duration-300">
            {currentTransitionName && (
              <span className="text-xs text-white/80 bg-black/60 px-2 py-1 rounded-full border border-white/30">
                {currentTransitionName}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 1. CSÚSZKA – AKTUÁLIS KLIP */}
      {currentClip && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
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
            value={timeInClip}
            onChange={(e) => handleClipScrub(Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      {/* 2. CSÚSZKA – TELJES VIDEÓ */}
      {clips.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Full video</span>
            <span>
              {formatTime(globalTime)} / {formatTime(totalDuration)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={totalDuration || 0}
            step={0.1}
            value={globalTime}
            onChange={(e) => handleTimelineScrub(Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      {/* Transition markerek a timeline-on */}
      {clips.length > 1 && (
        <div className="relative h-4 mt-1">
          {(() => {
            let acc = 0;
            return clips.slice(0, -1).map((clip, index) => {
              acc += clip.duration;
              const left = (acc / safeTotal) * 100;
              return (
                <div
                  key={index}
                  className="absolute top-0 bottom-0 w-[2px] bg-primary/70"
                  style={{ left: `${left}%` }}
                />
              );
            });
          })()}
        </div>
      )}
    </Card>
  );
};

export const PreviewPanel = forwardRef(PreviewPanelInner);
