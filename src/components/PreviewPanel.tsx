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
  const imageAnimationRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);

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
    if (imageAnimationRef.current) {
      cancelAnimationFrame(imageAnimationRef.current);
      imageAnimationRef.current = null;
    }

    if (item.type === "image") {
      const img = new Image();
      img.src = URL.createObjectURL(item.file);
      img.onload = () => {
        const focalPoint = item.focalPoint;
        
        // Always draw the image first (static)
        const drawStatic = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
          const x = (canvas.width - img.width * scale) / 2;
          const y = (canvas.height - img.height * scale) / 2;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        };
        
        if (focalPoint && isPlaying) {
          // Animate zoom to focal point
          const startTime = Date.now();
          const animationDuration = item.duration * 1000; // Convert to ms
          const startScale = 1;
          const endScale = 1.5;
          
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / animationDuration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
            
            const currentScale = startScale + (endScale - startScale) * easeProgress;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Calculate base position
            const baseScale = Math.min(canvas.width / img.width, canvas.height / img.height);
            const scaledWidth = img.width * baseScale * currentScale;
            const scaledHeight = img.height * baseScale * currentScale;
            
            // Interpolate position towards focal point
            const targetX = canvas.width / 2 - (focalPoint.x * img.width * baseScale * currentScale);
            const targetY = canvas.height / 2 - (focalPoint.y * img.height * baseScale * currentScale);
            const startX = (canvas.width - img.width * baseScale) / 2;
            const startY = (canvas.height - img.height * baseScale) / 2;
            
            const x = startX + (targetX - startX) * easeProgress;
            const y = startY + (targetY - startY) * easeProgress;
            
            ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
            
            if (progress < 1 && isPlaying) {
              imageAnimationRef.current = requestAnimationFrame(animate);
            }
          };
          
          animate();
        } else {
          // Static image display
          drawStatic();
        }
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
        const clips = item.clips || [];
        
        if (clips.length > 0 && currentClipIndex < clips.length) {
          const clip = clips[currentClipIndex];
          video.currentTime = clip.startTime;
          
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
        } else {
          // No clips defined, play entire video
          if (isPlaying) {
            video.play().then(() => {
              drawVideoFrame();
            });
          } else {
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
        }
      };
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (imageAnimationRef.current) {
        cancelAnimationFrame(imageAnimationRef.current);
      }
    };
  }, [items, currentIndex, isPlaying, currentClipIndex]);

  useEffect(() => {
    if (!isPlaying || items.length === 0) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const currentItem = items[currentIndex];
        
        // Handle video clips
        if (currentItem.type === "video" && currentItem.clips && currentItem.clips.length > 0) {
          const clips = currentItem.clips;
          const currentClip = clips[currentClipIndex];
          
          if (!currentClip) {
            // Move to next item
            if (currentIndex < items.length - 1) {
              setCurrentIndex(currentIndex + 1);
              setCurrentClipIndex(0);
              return 0;
            } else {
              setIsPlaying(false);
              return 0;
            }
          }
          
          const clipDuration = currentClip.endTime - currentClip.startTime;
          
          if (prev >= clipDuration) {
            // Move to next clip or next item
            if (currentClipIndex < clips.length - 1) {
              setCurrentClipIndex(currentClipIndex + 1);
              return 0;
            } else if (currentIndex < items.length - 1) {
              setCurrentIndex(currentIndex + 1);
              setCurrentClipIndex(0);
              return 0;
            } else {
              setIsPlaying(false);
              return clipDuration;
            }
          }
          
          // Check if video needs to skip to next clip
          if (videoRef.current && videoRef.current.currentTime >= currentClip.endTime) {
            if (currentClipIndex < clips.length - 1) {
              setCurrentClipIndex(currentClipIndex + 1);
              return 0;
            } else if (currentIndex < items.length - 1) {
              setCurrentIndex(currentIndex + 1);
              setCurrentClipIndex(0);
              return 0;
            } else {
              setIsPlaying(false);
              return clipDuration;
            }
          }
        } else {
          // Handle normal duration
          if (prev >= currentItem.duration) {
            if (currentIndex < items.length - 1) {
              setCurrentIndex(currentIndex + 1);
              setCurrentClipIndex(0);
              return 0;
            } else {
              setIsPlaying(false);
              return currentItem.duration;
            }
          }
        }
        
        return prev + 0.1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, currentIndex, currentClipIndex, items]);

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
    setCurrentClipIndex(0);
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
