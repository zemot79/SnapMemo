import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { MediaItem } from "./Timeline";

interface PreviewPanelProps {
  items: MediaItem[];
}

export const PreviewPanel = ({ items }: PreviewPanelProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Render current item on canvas
  useEffect(() => {
    if (!canvasRef.current || items.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const item = items[currentIndex];
    if (!item) return;

    // Clean up previous video
    if (videoRef.current) {
      videoRef.current.pause();
      URL.revokeObjectURL(videoRef.current.src);
      videoRef.current = null;
    }

    // Cancel any ongoing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (item.type === "image") {
      const img = new Image();
      img.src = URL.createObjectURL(item.file);
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const scale = Math.min(
          canvas.width / img.width,
          canvas.height / img.height
        );
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        URL.revokeObjectURL(img.src);
      };
    } else if (item.type === "video") {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(item.file);
      video.muted = true;
      videoRef.current = video;

      const drawVideoFrame = () => {
        if (!video || !ctx || video.paused || video.ended) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const scale = Math.min(
          canvas.width / video.videoWidth,
          canvas.height / video.videoHeight
        );
        const x = (canvas.width - video.videoWidth * scale) / 2;
        const y = (canvas.height - video.videoHeight * scale) / 2;
        ctx.drawImage(
          video,
          x,
          y,
          video.videoWidth * scale,
          video.videoHeight * scale
        );
        
        animationFrameRef.current = requestAnimationFrame(drawVideoFrame);
      };

      video.onloadeddata = () => {
        if (isPlaying) {
          video.play().then(() => {
            drawVideoFrame();
          });
        } else {
          // Draw first frame
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const scale = Math.min(
            canvas.width / video.videoWidth,
            canvas.height / video.videoHeight
          );
          const x = (canvas.width - video.videoWidth * scale) / 2;
          const y = (canvas.height - video.videoHeight * scale) / 2;
          ctx.drawImage(
            video,
            x,
            y,
            video.videoWidth * scale,
            video.videoHeight * scale
          );
        }
      };
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [items, currentIndex, isPlaying]);

  useEffect(() => {
    if (!isPlaying || items.length === 0) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const currentItem = items[currentIndex];
        if (prev >= currentItem.duration) {
          if (currentIndex < items.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else {
            setIsPlaying(false);
            return currentItem.duration;
          }
        }
        return prev + 0.1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, currentIndex, items]);

  const handlePlayPause = () => {
    const newPlayingState = !isPlaying;
    setIsPlaying(newPlayingState);
    
    if (videoRef.current) {
      if (newPlayingState) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
    setProgress(0);
    
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border flex items-center justify-center h-full">
        <p className="text-muted-foreground">Nincs megjeleníthető tartalom</p>
      </div>
    );
  }

  const currentItem = items[currentIndex];
  const progressPercentage = currentItem
    ? (progress / currentItem.duration) * 100
    : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          className="w-full h-auto bg-black"
        />
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {currentIndex + 1} / {items.length} - {currentItem?.file.name}
            </span>
            <span className="text-muted-foreground">
              {progress.toFixed(1)}s / {currentItem?.duration}s
            </span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-100"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={handlePlayPause} size="lg" className="gap-2">
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  Szünet
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Lejátszás
                </>
              )}
            </Button>
            <Button onClick={handleReset} variant="outline" size="lg" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Újra
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
