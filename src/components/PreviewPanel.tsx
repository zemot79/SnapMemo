import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useState,
  useMemo,
} from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import type { MediaItem } from "@/components/Timeline";
import type { TransitionId } from "@/lib/transitions";

// A ref-ből hívható metódusok
export interface PreviewPanelRef {
  play: () => void;
  pause: () => void;
  startPlayback: () => void; // ezt hívod export előtt
  seekToStart: () => void;
}

// Normálizált klip a playernek
type NormalizedItem = {
  id: string;
  label: string;
  type: "video" | "image";
  src: string;
  duration: number; // mp-ben
};

interface PreviewPanelProps {
  items: MediaItem[];

  // hogy kompatibilis legyen a mostani hívással:
  selectedTransitions?: TransitionId[];
  transitionDuration?: number;
  [key: string]: any; // audioFile, location, stb. – most nem használjuk
}

export const PreviewPanel = forwardRef<PreviewPanelRef, PreviewPanelProps>(
  ({ items }, ref) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    // Globális lejátszási idő (0..totalDuration)
    const [playhead, setPlayhead] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // ------- MEDIA NORMALIZÁLÁS (Title card, képek, videók, logo) -------

    const normalized = useMemo<NormalizedItem[]>(() => {
      return (items || []).map((item, index) => {
        const baseDuration =
          item.duration ??
          item.videoLength ??
          (item.type === "titleCard" ? 4 : item.type === "logoCard" ? 2 : 3);

        const isVideo = item.type === "video";

        // videónál url vagy File → objectURL
        let src = "";
        if (isVideo) {
          if (item.url) src = item.url;
          else if (item.file instanceof File) src = URL.createObjectURL(item.file);
        } else {
          if (item.thumbnail) src = item.thumbnail;
          else if (item.file instanceof File) src = URL.createObjectURL(item.file);
        }

        return {
          id: item.id || `item-${index}`,
          label:
            item.type === "titleCard"
              ? "Title card"
              : item.type === "logoCard"
              ? "Logo"
              : item.file?.name || `Clip ${index + 1}`,
          type: isVideo ? "video" : "image",
          src,
          duration: baseDuration || 3,
        };
      });
    }, [items]);

    const totalDuration = useMemo(
      () => normalized.reduce((sum, it) => sum + it.duration, 0),
      [normalized]
    );

    // Ha nincs semmi, ne dőljön el
    const safeTotal = totalDuration || 1;

    // Jelenlegi klip index + offset (mp) a globális playhead alapján
    const { currentIndex, clipOffset, clipStartTime } = useMemo(() => {
      if (!normalized.length) {
        return { currentIndex: 0, clipOffset: 0, clipStartTime: 0 };
      }

      let t = playhead;
      for (let i = 0; i < normalized.length; i++) {
        const d = normalized[i].duration;
        if (t <= d || i === normalized.length - 1) {
          return {
            currentIndex: i,
            clipOffset: Math.max(0, Math.min(t, d)),
            clipStartTime:
              normalized.slice(0, i).reduce((sum, it) => sum + it.duration, 0) || 0,
          };
        }
        t -= d;
      }

      const last = normalized[normalized.length - 1];
      const start =
        normalized.slice(0, normalized.length - 1).reduce((s, it) => s + it.duration, 0) ||
        0;
      return { currentIndex: normalized.length - 1, clipOffset: last.duration, clipStartTime: start };
    }, [normalized, playhead]);

    const currentItem = normalized[currentIndex];

    // ------- PLAY / PAUSE LOOP (globális idő) -------

    useEffect(() => {
      if (!isPlaying || !normalized.length) return;

      let frame: number;
      let last = performance.now();

      const tick = (now: number) => {
        const dt = (now - last) / 1000;
        last = now;

        setPlayhead((prev) => {
          const next = prev + dt;
          if (next >= safeTotal) {
            // elértük a végét
            setIsPlaying(false);
            return safeTotal;
          }
          return next;
        });

        frame = requestAnimationFrame(tick);
      };

      frame = requestAnimationFrame(tick);

      return () => cancelAnimationFrame(frame);
    }, [isPlaying, normalized, safeTotal]);

    // ------- VIDEÓ SZINKRONIZÁLÁS A PLAYHEADHEZ -------

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !currentItem) return;

      if (currentItem.type !== "video") {
        // képnél csak pauzáljuk a videót
        if (!video.paused) video.pause();
        return;
      }

      // ha másik klipre léptünk → forráscsere
      const currentId = video.dataset.currentId;
      if (currentId !== currentItem.id) {
        video.dataset.currentId = currentItem.id;
        video.src = currentItem.src || "";
        video.load();

        const onLoaded = () => {
          video.currentTime = clipOffset;
          if (isPlaying) {
            video.play().catch(() => {});
          }
        };

        video.onloadedmetadata = onLoaded;
        return;
      }

      // ugyanaz a klip: csak az időt szinkronizáljuk, ha nagyon elcsúszott
      if (Math.abs(video.currentTime - clipOffset) > 0.3 && !Number.isNaN(clipOffset)) {
        try {
          video.currentTime = clipOffset;
        } catch {
          // ignore
        }
      }

      if (isPlaying && video.paused) {
        video.play().catch(() => {});
      }
      if (!isPlaying && !video.paused) {
        video.pause();
      }
    }, [currentItem, clipOffset, isPlaying]);

    // ------- REF METÓDUSOK -------

    useImperativeHandle(ref, () => ({
      play: () => setIsPlaying(true),
      pause: () => setIsPlaying(false),
      startPlayback: () => {
        setPlayhead(0);
        setIsPlaying(true);
      },
      seekToStart: () => {
        setPlayhead(0);
      },
    }));

    // ------- SLIDEREK HANDLEREI -------

    const handleClipScrub = (value: number) => {
      if (!currentItem) return;
      const v = Number(value);
      const newGlobal = clipStartTime + Math.min(Math.max(v, 0), currentItem.duration);
      setPlayhead(newGlobal);
    };

    const handleGlobalScrub = (value: number) => {
      const v = Number(value);
      setPlayhead(Math.min(Math.max(v, 0), safeTotal));
    };

    const togglePlay = () => {
      // ha a végén állunk és play, ugorjunk elejére
      if (!isPlaying && playhead >= safeTotal - 0.01) {
        setPlayhead(0);
      }
      setIsPlaying((p) => !p);
    };

    // ------- FORMÁZOTT IDŐK -------

    const formatTime = (sec: number) => {
      const s = Math.max(0, Math.floor(sec));
      const m = Math.floor(s / 60);
      const r = s % 60;
      return `${m}:${r.toString().padStart(2, "0")}`;
    };

    const clipLabel =
      currentItem?.label || `Clip ${currentIndex + 1}/${normalized.length || 1}`;

    return (
      <Card className="border-border bg-card p-4 space-y-4">
        {/* FŐ ELŐNÉZET */}
        <div className="aspect-video rounded-lg overflow-hidden bg-black">
          {currentItem ? (
            currentItem.type === "video" ? (
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                preload="metadata"
                muted
              />
            ) : (
              <img
                src={currentItem.src}
                alt={clipLabel}
                className="w-full h-full object-contain"
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              Add media to preview your video.
            </div>
          )}
        </div>

        {/* FELSŐ SOR – PLAY + INFÓ */}
        <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={togglePlay}
              disabled={!normalized.length}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            <div className="flex flex-col">
              <span className="font-medium">
                {normalized.length > 0
                  ? `Clip ${currentIndex + 1} / ${normalized.length}`
                  : "No clips"}
              </span>
              {currentItem && (
                <span className="text-muted-foreground text-[11px] sm:text-xs truncate max-w-[240px]">
                  {clipLabel}
                </span>
              )}
            </div>
          </div>

          {currentItem && (
            <div className="text-right text-[11px] sm:text-xs text-muted-foreground">
              <div>
                Clip: {formatTime(clipOffset)} / {formatTime(currentItem.duration)}
              </div>
              <div>
                Total: {formatTime(playhead)} / {formatTime(safeTotal)}
              </div>
            </div>
          )}
        </div>

        {/* CLIP PROGRESS (felső slider) */}
        {currentItem && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Current clip</span>
              <span>
                {formatTime(clipOffset)} / {formatTime(currentItem.duration)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={currentItem.duration}
              step={0.05}
              value={clipOffset}
              onChange={(e) => handleClipScrub(Number(e.target.value))}
              className="w-full"
            />
          </div>
        )}

        {/* GLOBAL PROGRESS (alsó slider) */}
        {normalized.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Full timeline</span>
              <span>
                {formatTime(playhead)} / {formatTime(safeTotal)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={safeTotal}
              step={0.05}
              value={playhead}
              onChange={(e) => handleGlobalScrub(Number(e.target.value))}
              className="w-full"
            />
          </div>
        )}
      </Card>
    );
  }
);

PreviewPanel.displayName = "PreviewPanel";
