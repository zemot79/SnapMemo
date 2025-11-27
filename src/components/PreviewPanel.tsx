import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";

import { Card } from "@/components/ui/card";
import { buildTransitionMap, TransitionId } from "@/lib/transitions";

export interface PreviewPanelRef {
  play: () => void;
  pause: () => void;
}

interface PreviewPanelProps {
  items: any[];
  selectedTransitions: TransitionId[];
  transitionDuration: number;
}

export const PreviewPanel = forwardRef<
  PreviewPanelRef,
  PreviewPanelProps
>(({ items, selectedTransitions, transitionDuration }, ref) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const transitions = buildTransitionMap(
    items,
    selectedTransitions,
    transitionDuration
  );

  // ======================================================
  // Extern API: play(), pause()
  // ======================================================
  useImperativeHandle(ref, () => ({
    play: () => videoRef.current?.play(),
    pause: () => videoRef.current?.pause(),
  }));

  // ======================================================
  // Clip betöltése
  // ======================================================
  const loadClip = (index: number) => {
    if (!videoRef.current) return;

    const item = items[index];
    if (!item) return;

    // Ha File van, URL-t generálunk
    if (item.file instanceof File) {
      const url = URL.createObjectURL(item.file);
      videoRef.current.src = url;
    } else {
      videoRef.current.src =
        item.url || item.thumbnail || item.fileUrl || "";
    }

    videoRef.current.load();
  };

  useEffect(() => {
    loadClip(0);
  }, [items]);

  // ======================================================
  // Video end → transition → next
  // ======================================================
  const handleEnded = () => {
    const next = currentIndex + 1;

    if (next >= items.length) return;

    const tr = transitions[currentIndex];

    if (!tr) {
      setCurrentIndex(next);
      loadClip(next);
      videoRef.current?.play();
      return;
    }

    setIsTransitioning(true);

    setTimeout(() => {
      setIsTransitioning(false);
      setCurrentIndex(next);
      loadClip(next);
      videoRef.current?.play();
    }, tr.duration * 1000);
  };

  return (
    <Card className="relative w-full aspect-video bg-black overflow-hidden rounded-xl shadow-lg">
      {isTransitioning && (
        <div className="absolute inset-0 z-20 transition-all duration-500 bg-black/80" />
      )}

      <video
        ref={videoRef}
        onEnded={handleEnded}
        className="w-full h-full object-cover"
        preload="metadata"
        controls
      />
    </Card>
  );
});
