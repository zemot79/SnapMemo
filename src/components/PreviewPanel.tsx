import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { MediaItem } from "./Timeline";

interface PreviewPanelProps {
  items: MediaItem[];
  audioFile?: File | null;
  transitions?: string[];
}

export const PreviewPanel = ({ items, audioFile, transitions = ["fade"] }: PreviewPanelProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const imageAnimationRef = useRef<number | null>(null);
  const transitionFrameRef = useRef<number | null>(null);
  const blobUrlsRef = useRef<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const previousImageRef = useRef<HTMLCanvasElement | null>(null);

  // Get random transition
  const getRandomTransition = () => {
    if (transitions.length === 0) return "fade";
    return transitions[Math.floor(Math.random() * transitions.length)];
  };

  // Apply transition effect
  const applyTransition = (
    ctx: CanvasRenderingContext2D,
    prevCanvas: HTMLCanvasElement,
    currentImage: HTMLImageElement | HTMLVideoElement,
    progress: number,
    transitionType: string
  ) => {
    const canvas = ctx.canvas;
    
    switch (transitionType) {
      case "fade":
        // Draw previous image
        ctx.globalAlpha = 1 - progress;
        ctx.drawImage(prevCanvas, 0, 0);
        // Draw current image
        ctx.globalAlpha = progress;
        const scale = Math.min(canvas.width / currentImage.width, canvas.height / currentImage.height);
        const x = (canvas.width - currentImage.width * scale) / 2;
        const y = (canvas.height - currentImage.height * scale) / 2;
        ctx.drawImage(currentImage, x, y, currentImage.width * scale, currentImage.height * scale);
        ctx.globalAlpha = 1;
        break;
        
      case "slideLeft":
        ctx.drawImage(prevCanvas, -canvas.width * progress, 0);
        const scaleLeft = Math.min(canvas.width / currentImage.width, canvas.height / currentImage.height);
        const xLeft = canvas.width * (1 - progress) + (canvas.width - currentImage.width * scaleLeft) / 2;
        const yLeft = (canvas.height - currentImage.height * scaleLeft) / 2;
        ctx.drawImage(currentImage, xLeft, yLeft, currentImage.width * scaleLeft, currentImage.height * scaleLeft);
        break;
        
      case "slideRight":
        ctx.drawImage(prevCanvas, canvas.width * progress, 0);
        const scaleRight = Math.min(canvas.width / currentImage.width, canvas.height / currentImage.height);
        const xRight = -canvas.width * (1 - progress) + (canvas.width - currentImage.width * scaleRight) / 2;
        const yRight = (canvas.height - currentImage.height * scaleRight) / 2;
        ctx.drawImage(currentImage, xRight, yRight, currentImage.width * scaleRight, currentImage.height * scaleRight);
        break;
        
      case "zoomIn":
        ctx.globalAlpha = 1 - progress;
        ctx.drawImage(prevCanvas, 0, 0);
        ctx.globalAlpha = progress;
        const zoomScale = Math.min(canvas.width / currentImage.width, canvas.height / currentImage.height) * progress;
        const xZoom = (canvas.width - currentImage.width * zoomScale) / 2;
        const yZoom = (canvas.height - currentImage.height * zoomScale) / 2;
        ctx.drawImage(currentImage, xZoom, yZoom, currentImage.width * zoomScale, currentImage.height * zoomScale);
        ctx.globalAlpha = 1;
        break;
        
      case "zoomOut":
        const zoomOutScale = Math.min(canvas.width / currentImage.width, canvas.height / currentImage.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(2 - progress, 2 - progress);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        ctx.globalAlpha = 1 - progress;
        ctx.drawImage(prevCanvas, 0, 0);
        ctx.restore();
        ctx.globalAlpha = progress;
        const xZoomOut = (canvas.width - currentImage.width * zoomOutScale) / 2;
        const yZoomOut = (canvas.height - currentImage.height * zoomOutScale) / 2;
        ctx.drawImage(currentImage, xZoomOut, yZoomOut, currentImage.width * zoomOutScale, currentImage.height * zoomOutScale);
        ctx.globalAlpha = 1;
        break;
        
      case "wipe":
        ctx.drawImage(prevCanvas, 0, 0);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width * progress, canvas.height);
        ctx.clip();
        const scaleWipe = Math.min(canvas.width / currentImage.width, canvas.height / currentImage.height);
        const xWipe = (canvas.width - currentImage.width * scaleWipe) / 2;
        const yWipe = (canvas.height - currentImage.height * scaleWipe) / 2;
        ctx.drawImage(currentImage, xWipe, yWipe, currentImage.width * scaleWipe, currentImage.height * scaleWipe);
        ctx.restore();
        break;
    }
  };

  // Render current item on canvas
  useEffect(() => {
    if (!canvasRef.current || items.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const item = items[currentIndex];
    if (!item) return;

    console.log('Rendering item:', currentIndex, item.type);

    // Clean up previous video
    if (videoRef.current) {
      videoRef.current.pause();
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
    if (transitionFrameRef.current) {
      cancelAnimationFrame(transitionFrameRef.current);
      transitionFrameRef.current = null;
    }

    if (item.type === "image") {
      const img = new Image();
      const blobUrl = URL.createObjectURL(item.file);
      blobUrlsRef.current.push(blobUrl);
      img.src = blobUrl;
      
      img.onload = () => {
        console.log('Image loaded:', currentIndex);
        const focalPoint = item.focalPoint;
        
        // Save current canvas state for transition
        if (currentIndex > 0 && !previousImageRef.current) {
          previousImageRef.current = document.createElement('canvas');
          previousImageRef.current.width = canvas.width;
          previousImageRef.current.height = canvas.height;
          const prevCtx = previousImageRef.current.getContext('2d');
          if (prevCtx) {
            prevCtx.drawImage(canvas, 0, 0);
          }
        }
        
        // Draw static image function
        const drawStatic = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
          const x = (canvas.width - img.width * scale) / 2;
          const y = (canvas.height - img.height * scale) / 2;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        };
        
        // Always draw the image first
        drawStatic();
        
        if (focalPoint) {
          console.log('Starting focal point animation:', focalPoint);
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
            
            if (progress < 1) {
              imageAnimationRef.current = requestAnimationFrame(animate);
            }
          };
          
          animate();
        }
      };
    } else if (item.type === "video") {
      const video = document.createElement("video");
      const blobUrl = URL.createObjectURL(item.file);
      blobUrlsRef.current.push(blobUrl);
      video.src = blobUrl;
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
        console.log('Video loaded:', currentIndex);
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
      if (transitionFrameRef.current) {
        cancelAnimationFrame(transitionFrameRef.current);
      }
    };
  }, [items, currentIndex, isPlaying, currentClipIndex]);

  // Progress and item switching
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
          const transitionDuration = 0.5; // 0.5 seconds for transition
          
          if (prev >= currentItem.duration - transitionDuration && !isTransitioning && currentIndex < items.length - 1) {
            console.log('Starting transition');
            // Start transition
            setIsTransitioning(true);
            setTransitionProgress(0);
            
            // Capture current canvas state
            if (canvasRef.current && !previousImageRef.current) {
              previousImageRef.current = document.createElement('canvas');
              previousImageRef.current.width = canvasRef.current.width;
              previousImageRef.current.height = canvasRef.current.height;
              const prevCtx = previousImageRef.current.getContext('2d');
              if (prevCtx) {
                prevCtx.drawImage(canvasRef.current, 0, 0);
              }
            }
          }
          
          if (prev >= currentItem.duration) {
            if (currentIndex < items.length - 1) {
              setCurrentIndex(currentIndex + 1);
              setCurrentClipIndex(0);
              setIsTransitioning(false);
              setTransitionProgress(0);
              previousImageRef.current = null;
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
  }, [isPlaying, currentIndex, currentClipIndex, items, isTransitioning]);

  // Transition animation effect
  useEffect(() => {
    if (!isTransitioning || !canvasRef.current || !previousImageRef.current) return;
    
    console.log('Animating transition');
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const transitionType = getRandomTransition();
    const transitionDuration = 500; // 0.5 seconds
    const startTime = Date.now();
    
    const animateTransition = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / transitionDuration, 1);
      
      // Get current item image/video
      const nextIndex = Math.min(currentIndex + 1, items.length - 1);
      const nextItem = items[nextIndex];
      
      if (nextItem && nextItem.type === "image") {
        const img = new Image();
        const blobUrl = URL.createObjectURL(nextItem.file);
        img.src = blobUrl;
        
        img.onload = () => {
          applyTransition(ctx, previousImageRef.current!, img, progress, transitionType);
          
          if (progress < 1) {
            transitionFrameRef.current = requestAnimationFrame(animateTransition);
          } else {
            setIsTransitioning(false);
            previousImageRef.current = null;
          }
          URL.revokeObjectURL(blobUrl);
        };
      } else {
        // For videos or if no next item, just finish transition
        if (progress < 1) {
          transitionFrameRef.current = requestAnimationFrame(animateTransition);
        } else {
          setIsTransitioning(false);
          previousImageRef.current = null;
        }
      }
    };
    
    animateTransition();
    
    return () => {
      if (transitionFrameRef.current) {
        cancelAnimationFrame(transitionFrameRef.current);
      }
    };
  }, [isTransitioning, currentIndex, items, transitions]);

  // Initial canvas setup - render first item immediately
  useEffect(() => {
    if (!canvasRef.current || items.length === 0 || currentIndex !== 0) return;
    
    console.log('Initial canvas setup');
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const firstItem = items[0];
    if (firstItem.type === "image") {
      const img = new Image();
      const blobUrl = URL.createObjectURL(firstItem.file);
      blobUrlsRef.current.push(blobUrl);
      img.src = blobUrl;
      
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      };
    } else if (firstItem.type === "video") {
      const video = document.createElement("video");
      const blobUrl = URL.createObjectURL(firstItem.file);
      blobUrlsRef.current.push(blobUrl);
      video.src = blobUrl;
      video.muted = true;
      
      video.onloadeddata = () => {
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
      };
    }
  }, [items]);

  const handlePlayPause = () => {
    const newPlayingState = !isPlaying;
    setIsPlaying(newPlayingState);
    
    console.log('Play/Pause:', newPlayingState);
    
    if (videoRef.current) {
      if (newPlayingState) {
        videoRef.current.play().catch(err => {
          console.error('Video play error:', err);
        });
      } else {
        videoRef.current.pause();
      }
    }
    
    if (audioRef.current) {
      if (newPlayingState) {
        audioRef.current.play().catch(err => {
          console.error('Audio play error:', err);
        });
      } else {
        audioRef.current.pause();
      }
    }
  };

  const handleReset = () => {
    console.log('Reset');
    setIsPlaying(false);
    setCurrentIndex(0);
    setCurrentClipIndex(0);
    setProgress(0);
    setIsTransitioning(false);
    setTransitionProgress(0);
    previousImageRef.current = null;
    
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
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

  // Setup audio
  React.useEffect(() => {
    if (!audioFile) return;
    
    console.log('Setting up audio');
    const blobUrl = URL.createObjectURL(audioFile);
    blobUrlsRef.current.push(blobUrl);
    const audio = new Audio(blobUrl);
    audio.loop = true;
    audioRef.current = audio;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioFile]);

  // Cleanup all blob URLs on unmount
  React.useEffect(() => {
    return () => {
      console.log('Cleaning up blob URLs:', blobUrlsRef.current.length);
      blobUrlsRef.current.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (err) {
          console.error('Error revoking blob URL:', err);
        }
      });
      blobUrlsRef.current = [];
      
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (imageAnimationRef.current) cancelAnimationFrame(imageAnimationRef.current);
      if (transitionFrameRef.current) cancelAnimationFrame(transitionFrameRef.current);
      
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current = null;
      }
    };
  }, []);

  return (
    <div className="bg-card rounded-lg border border-border p-6 h-full flex flex-col gap-4">
      <div className="flex-1 flex items-center justify-center bg-black rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          className="max-w-full max-h-full object-contain"
        />
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {currentIndex + 1} / {items.length}
            {currentItem?.type === "video" && currentItem.clips && currentItem.clips.length > 0 
              ? ` (Klip ${currentClipIndex + 1}/${currentItem.clips.length})`
              : ""
            }
          </span>
          <span>{progress.toFixed(1)}s / {currentItem?.duration.toFixed(1)}s</span>
        </div>
        
        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-100"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
        
        <div className="flex items-center justify-center gap-2">
          <Button
            onClick={handlePlayPause}
            size="lg"
            className="gap-2"
          >
            {isPlaying ? (
              <>
                <Pause className="h-5 w-5" />
                Szünet
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                Lejátszás
              </>
            )}
          </Button>
          
          <Button
            onClick={handleReset}
            size="lg"
            variant="outline"
            className="gap-2"
          >
            <RotateCcw className="h-5 w-5" />
            Újra
          </Button>
        </div>
        
        {audioFile && (
          <div className="text-center text-sm text-muted-foreground">
            🎵 Háttérzene: {audioFile.name}
          </div>
        )}
      </div>
    </div>
  );
};
