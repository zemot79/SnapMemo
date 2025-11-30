import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useState,
  useMemo,
} from "react";
import { Card } from "@/components/ui/card";

// Ref, amit az Index.tsx használ (startPlayback/play/pause)
export interface PreviewPanelRef {
  play: () => void;
  pause: () => void;
  startPlayback: () => void;
}

// Props szándékosan tág, hogy a régi hívások se dőljenek el
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
  selectedTransitions?: string[];
  transitionDuration?: number;
}

type NormalizedClip = {
  id: string;
  src: string;
  isVideo: boolean;
  duration: number;
  /** Videó szegmens kezdete az eredeti fájlban (sec) */
  videoStart?: number;
};

const FALLBACK_DURATION = 3;

// Transition ID → CSS class (index.css-ben definiált animációk)
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

  // Globális idővonal idő (sec)
  const [globalTime, setGlobalTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Transition overlay állapot
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [lastIndex, setLastIndex] = useState(0);

  // --------- CAPCUT-STÍLUSÚ KLIP NORMALIZÁLÁS (szegmensekkel) ----------

  const clips: NormalizedClip[] = useMemo(() => {
    if (!items || !items.length) return [];

    const result: NormalizedClip[] = [];

    items.forEach((item, idx) => {
      // Alap duration – nem videóknál, vagy ha nincs explicit clip
      let baseDur: number =
        typeof item.duration === "number"
          ? item.duration
          : typeof item.duration === "string"
          ? parseFloat(item.duration)
          : FALLBACK_DURATION;

      if (!Number.isFinite(baseDur) || baseDur <= 0) {
        if (item.type === "titleCard") baseDur = 4;
        else if (item.type === "logoCard") baseDur = 2;
        else baseDur = FALLBACK_DURATION;
      }

      const isVideo = item.type === "video";

      // Forrás (src) feloldása egyszer item-re
      const previewUrl = (item as any).previewUrl as string | undefined;
      let src = "";
      if (isVideo) {
        if (previewUrl) src = previewUrl;
        else if (item.url) src = item.url;
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

      if (!isVideo) {
        // Képek / titleCard / logoCard – egyetlen klip
        result.push({
          id: item.id || `clip-${idx}`,
          src,
          isVideo: false,
          duration: baseDur,
        });
        return;
      }

      // VIDEÓ: ha vannak clips[] szegmensek, mindegyik külön klip lesz
      if (Array.isArray(item.clips) && item.clips.length > 0) {
        item.clips.forEach((clip: any, cIdx: number) => {
          const rawDur =
            typeof clip.endTime === "number" &&
            typeof clip.startTime === "number"
              ? clip.endTime - clip.startTime
              : 0;
          const segDur = rawDur > 0 ? rawDur : baseDur;

          result.push({
            id: `${item.id || `video-${idx}`}-seg-${clip.id || cIdx}`,
            src,
            isVideo: true,
            duration: segDur,
            videoStart: clip.startTime ?? 0,
          });
        });
      } else {
        // Nincsenek szegmensek → egy klip, teljes hossz
        result.push({
          id: item.id || `clip-${idx}`,
          src,
          isVideo: true,
          duration: baseDur,
          videoStart: 0,
        });
      }
    });

    return result;
  }, [items]);

  const totalDuration = useMemo(
    () => clips.reduce((s, c) => s + c.duration, 0),
    [clips]
  );
  const safeTotal = totalDuration || 1;

  // --------- Aktuális klip + lokális idő (timeInClip) ----------

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

  // Melyik transition megy két klip között
  const currentTransition =
    selectedTransitions.length > 0
      ? selectedTransitions[
          (currentIndex - 1 + selectedTransitions.length) %
            selectedTransitions.length
        ]
      : undefined;

  // --------- Lejátszás loop (requestAnimationFrame) ----------

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

  // --------- Videó szinkron (CapCut-szerű szegmensek) ----------

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentClip) return;

    if (!currentClip.isVideo) {
      // Képnél / title-nél leállítjuk a video elemet
      if (!video.paused) video.pause();
      return;
    }

    const src = currentClip.src;
    if (!src) return;

    const curSrc = video.getAttribute("data-src");

    const setTimeAndPlay = () => {
      try {
        const startOffset = currentClip.videoStart ?? 0;
        const targetTime = startOffset + timeInClip;

        // Ha nagyon elcsúszott, ugorjunk az új pozícióra
        if (Math.abs(video.currentTime - targetTime) > 0.3) {
          video.currentTime = targetTime;
        }

        if (isPlaying && video.paused) {
          void video.play().catch(() => {});
        }
        if (!isPlaying && !video.paused) {
          video.pause();
        }
      } catch {
        // ignore
      }
    };

    // Új src → reload + seek
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

  // --------- Transition overlay vezérlés ----------

  useEffect(() => {
    if (!clips.length) return;

    if (currentIndex !== lastIndex && currentIndex > 0) {
      setIsTransitioning(true);
      setLastIndex(currentIndex);

      const timeout = setTimeout(() => {
        setIsTransitioning(false);
      }, transitionDuration * 1000);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, lastIndex, transitionDuration, clips.length]);

  // --------- SCRUB HANDLEREK (NEM állítják le a lejátszást) ----------

  const scrubClip = (value: number) => {
    // isPlaying-hez nem nyúlunk → ha ment a play, megy tovább
    const clamped = Math.max(
      0,
      Math.min(value, currentClip?.duration ?? FALLBACK_DURATION)
    );
    setGlobalTime(clipStartTime + clamped);
  };

  const scrubTimeline = (value: number) => {
    const clamped = Math.max(0, Math.min(value, totalDuration || 0));
    setGlobalTime(clamped);
  };

  // --------- REF METÓDUSOK ----------

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

  // --------- RENDER SEGÉDEK ----------

  const renderMedia = () => {
    if (!currentClip) {
      return (
        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground bg-black">
          No media to preview
        </div>
      );
    }

    if (currentClip.isVideo) {
      return (
        <video
          ref={videoRef}
          className="w-full h-full object-contain bg-black"
          muted
          playsInline
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

  const togglePlay = () => {
    if (!clips.length || totalDuration === 0) return;
    setIsPlaying((prev) => !prev);
  };

  const formatTime = (value: number) => {
    if (!Number.isFinite(value)) return "0.0s";
    return `${value.toFixed(1)}s`;
  };

  const currentClipDuration = currentClip?.duration ?? 0;

  // --------- RENDER ----------

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

      {/* Fő preview transition overlay-jel */}
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
              ? ({
                  animationDuration: `${transitionDuration}s`,
                  ["--tw-duration" as any]: `${transitionDuration}s`,
                } as React.CSSProperties)
              : undefined
          }
        >
          {renderMedia()}
        </div>
      </div>

      {/* 1) Aktuális klip csúszka */}
      {currentClip && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Current clip</span>
            <span>
              {formatTime(timeInClip)} / {formatTime(currentClipDuration)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={currentClipDuration || FALLBACK_DURATION}
            step={0.05}
            value={timeInClip}
            onChange={(e) => scrubClip(Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      {/* 2) Teljes timeline csúszka + transition markerek */}
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
            onChange={(e) => scrubTimeline(Number(e.target.value))}
            className="w-full"
          />

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
        </div>
      )}
    </Card>
  );
};

export const PreviewPanel = forwardRef(PreviewPanelInner);
