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
  audioFile?: File | null;
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
};

const FALLBACK_DURATION = 3;

const PreviewPanelInner = (
  { items, selectedTransitions, transitionDuration }: PreviewPanelProps,
  ref: React.Ref<PreviewPanelRef>
) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [globalTime, setGlobalTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Normalize timeline clips
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
        else if (item.file instanceof File)
          src = URL.createObjectURL(item.file);
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
  const safeTotalDuration = totalDuration || 1;

  // current clip (index, clipStartTime, timeInClip)
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
    const start = clips.slice(0, lastIndex).reduce((s, c) => s + c.duration, 0);

    return {
      currentIndex: lastIndex,
      currentClip: lastClip,
      clipStartTime: start,
      timeInClip: lastClip.duration,
    };
  }, [clips, globalTime]);

  // Playback loop
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

  // Video sync
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentClip) return;

    if (!currentClip.isVideo) {
      if (!video.paused) video.pause();
      return;
    }

    const src = currentClip.src;
    if (!src) return;

    const curSrc = video.getAttribute("data-src");

    const syncTime = () => {
      try {
        const target = Math.min(
          timeInClip,
          Number.isFinite(video.duration) && video.duration > 0
            ? video.duration
            : timeInClip
        );
        if (Math.abs(video.currentTime - target) > 0.3) {
          video.currentTime = target;
        }

        if (isPlaying && video.paused) video.play().catch(() => {});
        if (!isPlaying && !video.paused) video.pause();
      } catch {}
    };

    if (curSrc !== src) {
      video.setAttribute("data-src", src);
      video.src = src;
      video.load();
      video.onloadedmetadata = syncTime;
    } else {
      syncTime();
    }
  }, [currentClip, timeInClip, isPlaying]);

  // Ref methods
  useImperativeHandle(ref, () => ({
    play: () => {
      if (totalDuration === 0) return;
      setIsPlaying(true);
    },
    pause: () => setIsPlaying(false),
    startPlayback: () => {
      if (totalDuration === 0) return;
      setGlobalTime(0);
      setIsPlaying(true);
    },
  }));

  // Reset playback on item change
  useEffect(() => {
    setGlobalTime(0);
    setIsPlaying(false);
  }, [clips.length]);

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
        className="w-full h-full object-contain bg-black"
      />
    );
  };

  // Transition markers
  const transitionMarkers = useMemo(() => {
    if (clips.length <= 1) return null;

    let acc = 0;
    return (
      <div className="relative h-4 mt-2">
        {clips.slice(0, -1).map((clip, idx) => {
          acc += clip.duration;
          const left = (acc / totalDuration) * 100;
          return (
            <div
              key={idx}
              className="absolute top-0 bottom-0 w-[2px] bg-primary/70"
              style={{ left: `${left}%` }}
            />
          );
        })}
      </div>
    );
  }, [clips, totalDuration]);

  return (
    <Card className="p-4 lg:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Timeline Preview</h3>
        <button
          type="button"
          onClick={() => {
            if (!isPlaying) {
              if (globalTime >= totalDuration - 0.05) {
                setGlobalTime(0);
              }
              setIsPlaying(true);
            } else {
              setIsPlaying(false);
            }
          }}
          className="text-xs px-3 py-1 rounded-full border border-border hover:bg-accent"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>

      {/* TRANSITION INFO */}
      {selectedTransitions && (
        <div className="text-[10px] text-muted-foreground flex gap-1 flex-wrap">
          {selectedTransitions.map((t) => (
            <span
              key={t}
              className="px-1 py-[1px] border rounded bg-background/80"
            >
              {t}
            </span>
          ))}
          <span>{(transitionDuration ?? 0.4).toFixed(1)}s</span>
        </div>
      )}

      <div className="aspect-video rounded-lg overflow-hidden bg-black">
        {renderMedia()}
      </div>

      {/* CLIP TIME SCRUBBER */}
      {currentClip && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
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
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
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

          {/* TRANSITION MARKERS */}
          {transitionMarkers}
        </div>
      )}
    </Card>
  );
};

export const PreviewPanel = forwardRef(PreviewPanelInner);
