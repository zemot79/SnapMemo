/* MINDEN VÁLTOZÁS JELÖLVE VAN  // FIX  <<< ======= */

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
  selectedTransitions?: string[];
  transitionDuration?: number;
}

type NormalizedClip = {
  id: string;
  src: string;
  isVideo: boolean;
  duration: number;
  videoStart?: number;
};

const FALLBACK_DURATION = 3;

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

  /* ----------------------------------------------------------
     1) CLIP NORMALIZÁLÁS – A previewUrl-hez 3 mp fix duration
     ---------------------------------------------------------- */

  const clips: NormalizedClip[] = useMemo(() => {
    if (!items || !items.length) return [];

    const result: NormalizedClip[] = [];

    items.forEach((item, idx) => {
      let baseDur =
        typeof item.duration === "number"
          ? item.duration
          : FALLBACK_DURATION;

      const isVideo = item.type === "video";

      const previewUrl = item.previewUrl as string | undefined;

      const src =
        previewUrl ||
        item.url ||
        (item.file ? URL.createObjectURL(item.file) : "");

      /* --------------- FIX #1: Duration correction ---------------
         Ha previewUrl létezik → mindig fix 3 mp preview klip
      ---------------------------------------------------------------- */
      const effectiveDuration = previewUrl ? 3 : baseDur;

      if (!isVideo) {
        result.push({
          id: item.id || `clip-${idx}`,
          src,
          isVideo: false,
          duration: effectiveDuration,
        });
        return;
      }

      if (Array.isArray(item.clips) && item.clips.length > 0) {
        // VIDEÓ SZEGMENSEK
        item.clips.forEach((clip: any, cIdx: number) => {
          result.push({
            id: `${item.id}-seg-${clip.id || cIdx}`,
            src,
            isVideo: true,
            duration: previewUrl
              ? 3
              : clip.endTime - clip.startTime || effectiveDuration,
            videoStart: clip.startTime ?? 0,
          });
        });
      } else {
        // NINCS SZEGMENS → egyetlen preview klip
        result.push({
          id: item.id,
          src,
          isVideo: true,
          duration: effectiveDuration,
          videoStart: 0,
        });
      }
    });

    return result;
  }, [items]);

  const totalDuration = clips.reduce((s, c) => s + c.duration, 0) || 1;

  /* ---------------------------------------------------------- */

  const { currentIndex, currentClip, clipStartTime, timeInClip } = useMemo(() => {
    let acc = 0;

    for (let i = 0; i < clips.length; i++) {
      const d = clips[i].duration;
      if (globalTime <= acc + d || i === clips.length - 1) {
        return {
          currentIndex: i,
          currentClip: clips[i],
          clipStartTime: acc,
          timeInClip: globalTime - acc,
        };
      }
      acc += d;
    }

    return {
      currentIndex: 0,
      currentClip: clips[0],
      clipStartTime: 0,
      timeInClip: 0,
    };
  }, [clips, globalTime]);

  const currentTransition =
    selectedTransitions[(currentIndex - 1 + selectedTransitions.length) %
      selectedTransitions.length];

  /* PLAYBACK LOOP */
  useEffect(() => {
    if (!isPlaying) return;

    let id: number;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;

      setGlobalTime((prev) => {
        if (prev + dt >= totalDuration) {
          setIsPlaying(false);
          return totalDuration;
        }
        return prev + dt;
      });

      id = requestAnimationFrame(loop);
    };

    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [isPlaying, totalDuration]);

  /* VIDEO SYNC */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentClip) return;

    if (!currentClip.isVideo) {
      video.pause();
      return;
    }

    const src = currentClip.src;
    const curSrc = video.getAttribute("data-src");

    const startOffset = currentClip.videoStart ?? 0;
    const targetTime = startOffset + timeInClip;

    const applyTime = () => {
      if (Math.abs(video.currentTime - targetTime) > 0.3) {
        video.currentTime = targetTime;
      }
      if (isPlaying) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    };

    if (curSrc !== src) {
      video.setAttribute("data-src", src);
      video.src = src;
      video.load();
      video.onloadedmetadata = () => {
        applyTime();
      };
    } else {
      applyTime();
    }
  }, [currentClip, timeInClip, isPlaying]);

  /* TRANSITION overlay */
  useEffect(() => {
    if (currentIndex !== lastIndex && currentIndex > 0) {
      setIsTransitioning(true);
      setLastIndex(currentIndex);

      const t = setTimeout(
        () => setIsTransitioning(false),
        transitionDuration * 1000
      );

      return () => clearTimeout(t);
    }
  }, [currentIndex, lastIndex, transitionDuration]);

  /* REF methods */
  useImperativeHandle(ref, () => ({
    play() {
      if (totalDuration > 0) setIsPlaying(true);
    },
    pause() {
      setIsPlaying(false);
    },
    startPlayback() {
      setGlobalTime(0);
      setIsPlaying(true);
    },
  }));

  /* RENDER MEDIA */
  const renderMedia = () => {
    if (!currentClip) {
      return (
        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground bg-black">
          No media
        </div>
      );
    }

    if (currentClip.isVideo) {
      return (
        <video
          key={currentClip.src}   // FIX #2 – ÚJRAKÉNYSZERÍTI A BETÖLTÉST
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
        alt=""
        className="w-full h-full object-contain bg-black"
      />
    );
  };

  /* RENDER */
  return (
    <Card className="p-4 space-y-4">
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <div
          className={
            "w-full h-full " +
            (isTransitioning && currentTransition
              ? getTransitionClass(currentTransition)
              : "")
          }
          style={
            isTransitioning
              ? ({ animationDuration: `${transitionDuration}s` } as any)
              : undefined
          }
        >
          {renderMedia()}
        </div>
      </div>
    </Card>
  );
};

export const PreviewPanel = forwardRef(PreviewPanelInner);
