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

  // -------------------------------------------------------
  // CORE PLAY / PAUSE
  // -------------------------------------------------------
  useImperativeHandle(ref, () => ({
    play: () => videoRef.current?.play(),
    pause: () => videoRef.current?.pause(),
  }));

  // -------------------------------------------------------
  // LOAD NEXT CLIP
  // -------------------------------------------------------
  const loadClip = (index: number) => {
    if (!videoRef.current) return;

    const item = items[index];

    if (!item) return;

    videoRef.current.src =
      item.url || item.thumbnail || item.fileUrl || "";

    videoRef.current.load();
  };

  useEffect(() => {
    loadClip(0);
  }, [items]);

  // -------------------------------------------------------
  // ON VIDEO END → Transition or Next
  // -------------------------------------------------------
  const handleEnded = () => {
    const nextIndex = currentIndex + 1;

    if (nextIndex >= items.length) return;

    const transition = transitions[currentIndex];

    if (!transition) {
      setCurrentIndex(nextIndex);
      loadClip(nextIndex);
      videoRef.current?.play();
      return;
    }

    // run CSS transition
    setIsTransitioning(true);

    setTimeout(() => {
      setIsTransitioning(false);
      setCurrentIndex(nextIndex);
      loadClip(nextIndex);
      videoRef.current?.play();
    }, transition.duration * 1000);
  };

  return (
    <Card className="relative w-full aspect-video bg-black overflow-hidden rounded-xl shadow-lg">
      {/* Transition overlay */}
      {isTransitioning && (
        <div
          className="absolute inset-0 z-20 transition-all duration-500 bg-black/80"
        />
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
