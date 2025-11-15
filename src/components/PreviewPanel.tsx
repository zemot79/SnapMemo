import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { MediaItem, TextOverlay } from "./Timeline";
import { GlobeAnimation } from "./GlobeAnimation";
import { geocodeLocation, Coordinates } from "@/lib/geocoding";
import { toast } from "sonner";

interface PreviewPanelProps {
  items: MediaItem[];
  audioFile?: File | null;
  transitions?: string[];
  location?: string;
  videoTitle?: string;
  videoDescription?: string;
  videoDate?: string;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  onPlaybackComplete?: () => void;
}

export interface PreviewPanelRef {
  startPlayback: () => void;
  resetPlayback: () => void;
}

export const PreviewPanel = forwardRef<PreviewPanelRef, PreviewPanelProps>(({ items, audioFile, transitions = ["fade"], location, videoTitle, videoDescription, videoDate, canvasRef: externalCanvasRef, onPlaybackComplete }, ref) => {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = externalCanvasRef || internalCanvasRef;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const imageAnimationRef = useRef<number | null>(null);
  const transitionFrameRef = useRef<number | null>(null);
  const blobUrlsRef = useRef<string[]>([]);
  const loadedImagesRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const previousImageRef = useRef<HTMLCanvasElement | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const isRenderingRef = useRef<boolean>(false);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  // Globe animation state
  const [showGlobeAnimation, setShowGlobeAnimation] = useState(false);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [isLoadingCoordinates, setIsLoadingCoordinates] = useState(false);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    startPlayback: () => {
      handleReset();
      // If there's a location with coordinates, show globe first
      if (coordinates && location) {
        setTimeout(() => setShowGlobeAnimation(true), 100);
      } else {
        setTimeout(() => setIsPlaying(true), 100);
      }
    },
    resetPlayback: () => {
      handleReset();
    }
  }));

  // Auto-start playback if requested
  useEffect(() => {
    if (items.length > 0 && !isPlaying) {
      // Removed auto-play, will be triggered via ref
    }
  }, []);

  // Render globe placeholder on canvas when globe animation is showing
  useEffect(() => {
    if (!canvasRef.current || !showGlobeAnimation || !location) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Draw a dark blue gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1e3a8a');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw location name in center
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(location, canvas.width / 2, canvas.height / 2);
    
    // Draw subtitle
    ctx.font = '36px Arial';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('📍 Location', canvas.width / 2, canvas.height / 2 + 80);
    
  }, [showGlobeAnimation, location]);

  // Geocode location when component mounts
  useEffect(() => {
    if (location && location.trim() !== "") {
      setIsLoadingCoordinates(true);
      geocodeLocation(location)
        .then((coords) => {
          if (coords) {
            console.log('Geocoded location:', coords);
            setCoordinates(coords);
          } else {
            console.warn('Could not geocode location:', location);
          }
        })
        .catch((err) => {
          console.error('Geocoding error:', err);
        })
        .finally(() => {
          setIsLoadingCoordinates(false);
        });
    }
  }, [location]);

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

    // Cancel video animation frames
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    // DON'T cancel imageAnimationRef here - let it keep rendering until new image starts
    // This prevents black screen flashes between images
    if (transitionFrameRef.current) {
      cancelAnimationFrame(transitionFrameRef.current);
      transitionFrameRef.current = null;
    }

    if (item.type === "image") {
      // Check if image is already loaded
      let img = loadedImagesRef.current.get(currentIndex);
      
      if (!img) {
        // Load new image
        img = new Image();
        const blobUrl = URL.createObjectURL(item.file);
        blobUrlsRef.current.push(blobUrl);
        img.src = blobUrl;
        
        img.onload = () => {
          console.log('✅ Image loaded successfully:', currentIndex);
          setLoadingStatus(`Image ${currentIndex + 1} loaded`);
          loadedImagesRef.current.set(currentIndex, img!);
          renderImage(img!);
        };
        
        img.onerror = (error) => {
          console.error('❌ Image load failed:', currentIndex, error);
          setErrorMessage(`Failed to load image ${currentIndex + 1}`);
          setLoadingStatus("");
        };
      } else {
        // Image already loaded, render immediately
        console.log('Using cached image:', currentIndex);
        renderImage(img);
      }
      
      function renderImage(img: HTMLImageElement) {
        // Don't cancel previous animation here - just let new one overwrite it
        // This prevents black screen flashes between images
        
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
        
        // Draw text overlays helper function
        const drawTextOverlays = () => {
          if (!item.textOverlays || item.textOverlays.length === 0) return;
          
          item.textOverlays.forEach(overlay => {
            ctx.save();
            
            // Calculate position
            const x = (overlay.x / 100) * canvas.width;
            const y = (overlay.y / 100) * canvas.height;
            
            // Set font
            ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Draw background
            if (overlay.backgroundColor) {
              const metrics = ctx.measureText(overlay.text);
              const padding = 20;
              const bgHeight = overlay.fontSize + padding * 2;
              const bgWidth = metrics.width + padding * 2;
              
              ctx.globalAlpha = overlay.opacity;
              ctx.fillStyle = overlay.backgroundColor;
              ctx.fillRect(x - bgWidth / 2, y - bgHeight / 2, bgWidth, bgHeight);
            }
            
            // Draw text
            ctx.globalAlpha = 1;
            ctx.fillStyle = overlay.color;
            ctx.fillText(overlay.text, x, y);
            
            ctx.restore();
          });
        };
        
        // Always draw the image first
        drawStatic();
        drawTextOverlays();
        
        // Check for Ken Burns or focal point animation
        const kenBurns = item.kenBurns;
        const focalPoints = item.focalPoint;
        const hasFocalPoint1 = focalPoints && focalPoints.length > 0;
        const hasFocalPoint2 = focalPoints && focalPoints.length > 1;
        const shouldAnimateKenBurns = kenBurns?.enabled && hasFocalPoint2;
        
        if (hasFocalPoint1 && !kenBurns?.enabled) {
          const focalPoint = focalPoints![0];
          console.log('✅ Starting focal point animation:', focalPoint);
          setLoadingStatus(`Animating image ${currentIndex + 1} with focal point`);
          setErrorMessage("");
          
          const startTime = Date.now();
          const animationDuration = item.duration * 1000;
          const startScale = 1;
          const endScale = 1.5;
          isRenderingRef.current = true;
          
          const animate = () => {
            // Cancel any previous animation from old image first
            if (imageAnimationRef.current) {
              cancelAnimationFrame(imageAnimationRef.current);
            }
            
            try {
              const elapsed = Date.now() - startTime;
              const progress = Math.min(elapsed / animationDuration, 1);
              const easeProgress = 1 - Math.pow(1 - progress, 3);
              
              const currentScale = startScale + (endScale - startScale) * easeProgress;
              
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = '#000000';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              const baseScale = Math.min(canvas.width / img.width, canvas.height / img.height);
              const scaledWidth = img.width * baseScale * currentScale;
              const scaledHeight = img.height * baseScale * currentScale;
              
              const targetX = canvas.width / 2 - (focalPoint.x * img.width * baseScale * currentScale);
              const targetY = canvas.height / 2 - (focalPoint.y * img.height * baseScale * currentScale);
              const startX = (canvas.width - img.width * baseScale) / 2;
              const startY = (canvas.height - img.height * baseScale) / 2;
              
              const x = startX + (targetX - startX) * easeProgress;
              const y = startY + (targetY - startY) * easeProgress;
              
              ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
              drawTextOverlays();
              
              // ALWAYS keep rendering - even after animation completes
              // This prevents black screens between transitions
              imageAnimationRef.current = requestAnimationFrame(animate);
            } catch (error) {
              console.error('❌ Focal point animation error:', error);
              setErrorMessage('Animation failed');
              toast.error('Animation error');
            }
          };
          
          animate();
        } else if (shouldAnimateKenBurns) {
          const targetPoint = focalPoints![1];
          console.log('✅ Starting Ken Burns zoom to point 2:', targetPoint);
          setLoadingStatus(`Ken Burns zoom on image ${currentIndex + 1}`);
          setErrorMessage("");
          
          const startTime = Date.now();
          const animationDuration = item.duration * 1000;
          const startScale = 1;
          const endScale = 1.5;
          isRenderingRef.current = true;
          
          const animate = () => {
            // Cancel any previous animation from old image first
            if (imageAnimationRef.current) {
              cancelAnimationFrame(imageAnimationRef.current);
            }
            
            try {
              const elapsed = Date.now() - startTime;
              const progress = Math.min(elapsed / animationDuration, 1);
              const easeProgress = 1 - Math.pow(1 - progress, 3);
              
              const currentScale = startScale + (endScale - startScale) * easeProgress;
              
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = '#000000';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              const baseScale = Math.min(canvas.width / img.width, canvas.height / img.height);
              const scaledWidth = img.width * baseScale * currentScale;
              const scaledHeight = img.height * baseScale * currentScale;
              
              // Convert percentage to actual coordinates
              const targetX = canvas.width / 2 - (targetPoint.x / 100 * img.width * baseScale * currentScale);
              const targetY = canvas.height / 2 - (targetPoint.y / 100 * img.height * baseScale * currentScale);
              const startX = (canvas.width - img.width * baseScale) / 2;
              const startY = (canvas.height - img.height * baseScale) / 2;
              
              const x = startX + (targetX - startX) * easeProgress;
              const y = startY + (targetY - startY) * easeProgress;
              
              ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
              drawTextOverlays();
              
              // Keep rendering continuously
              imageAnimationRef.current = requestAnimationFrame(animate);
            } catch (error) {
              console.error('❌ Ken Burns error:', error);
              setErrorMessage('Ken Burns failed');
              toast.error('Animation error');
            }
          };
          
          animate();
        } else {
          // No animation, keep rendering static image continuously
          console.log('✅ Static image - continuous render');
          setLoadingStatus("");
          setErrorMessage("");
          
          const renderStatic = () => {
            // Cancel any previous animation from old image first
            if (imageAnimationRef.current) {
              cancelAnimationFrame(imageAnimationRef.current);
            }
            
            try {
              drawStatic();
              drawTextOverlays();
              imageAnimationRef.current = requestAnimationFrame(renderStatic);
            } catch (error) {
              console.error('❌ Static render error:', error);
              toast.error('Render failed');
            }
          };
          
          renderStatic();
        }
      }
    } else if (item.type === "titleCard") {
      // Handle title card
      const img = new Image();
      const blobUrl = URL.createObjectURL(item.file);
      blobUrlsRef.current.push(blobUrl);
      img.src = blobUrl;
      
      img.onload = () => {
        console.log('Title card loaded:', currentIndex);
        
        // Don't cancel here - let the render loop handle it
        
        // Set up continuous rendering for title card
        const renderTitleCard = () => {
          // Cancel any previous animation from old image first
          if (imageAnimationRef.current) {
            cancelAnimationFrame(imageAnimationRef.current);
          }
          
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
          const x = (canvas.width - img.width * scale) / 2;
          const y = (canvas.height - img.height * scale) / 2;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          
          // Draw text overlays
          if (item.textOverlays && item.textOverlays.length > 0) {
            item.textOverlays.forEach(overlay => {
              ctx.save();
              
              const overlayX = (overlay.x / 100) * canvas.width;
              const overlayY = (overlay.y / 100) * canvas.height;
              
              ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              if (overlay.backgroundColor) {
                const metrics = ctx.measureText(overlay.text);
                const padding = 20;
                const bgHeight = overlay.fontSize + padding * 2;
                const bgWidth = metrics.width + padding * 2;
                
                ctx.globalAlpha = overlay.opacity;
                ctx.fillStyle = overlay.backgroundColor;
                ctx.fillRect(overlayX - bgWidth / 2, overlayY - bgHeight / 2, bgWidth, bgHeight);
              }
              
              ctx.globalAlpha = 1;
              ctx.fillStyle = overlay.color;
              ctx.fillText(overlay.text, overlayX, overlayY);
              
              ctx.restore();
            });
          }
          
          // Keep rendering continuously
          imageAnimationRef.current = requestAnimationFrame(renderTitleCard);
        };
        
        renderTitleCard();
      };
    } else if (item.type === "logoCard") {
      // Handle logo card - simple centered rendering
      const img = new Image();
      const blobUrl = URL.createObjectURL(item.file);
      blobUrlsRef.current.push(blobUrl);
      img.src = blobUrl;
      
      img.onload = () => {
        console.log('Logo card loaded:', currentIndex);
        
        // Set up continuous rendering for logo card
        const renderLogoCard = () => {
          // Cancel any previous animation from old image first
          if (imageAnimationRef.current) {
            cancelAnimationFrame(imageAnimationRef.current);
          }
          
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Draw white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw logo centered with contain fit
          const scale = Math.min(
            (canvas.width * 0.5) / img.width,
            (canvas.height * 0.5) / img.height
          );
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          const x = (canvas.width - scaledWidth) / 2;
          const y = (canvas.height - scaledHeight) / 2;
          
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
          
          // Keep rendering continuously
          imageAnimationRef.current = requestAnimationFrame(renderLogoCard);
        };
        
        renderLogoCard();
      };
    } else if (item.type === "video") {
      const video = document.createElement("video");
      const blobUrl = URL.createObjectURL(item.file);
      blobUrlsRef.current.push(blobUrl);
      video.src = blobUrl;
      video.muted = true;
      videoRef.current = video;

      const drawVideoFrame = () => {
        // Cancel any previous image animation from old image first
        if (imageAnimationRef.current) {
          cancelAnimationFrame(imageAnimationRef.current);
          imageAnimationRef.current = null;
        }
        
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
        
        // Draw text overlays
        if (item.textOverlays && item.textOverlays.length > 0) {
          item.textOverlays.forEach(overlay => {
            ctx.save();
            
            const overlayX = (overlay.x / 100) * canvas.width;
            const overlayY = (overlay.y / 100) * canvas.height;
            
            ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            if (overlay.backgroundColor) {
              const metrics = ctx.measureText(overlay.text);
              const padding = 20;
              const bgHeight = overlay.fontSize + padding * 2;
              const bgWidth = metrics.width + padding * 2;
              
              ctx.globalAlpha = overlay.opacity;
              ctx.fillStyle = overlay.backgroundColor;
              ctx.fillRect(overlayX - bgWidth / 2, overlayY - bgHeight / 2, bgWidth, bgHeight);
            }
            
            ctx.globalAlpha = 1;
            ctx.fillStyle = overlay.color;
            ctx.fillText(overlay.text, overlayX, overlayY);
            
            ctx.restore();
          });
        }
        
        animationFrameRef.current = requestAnimationFrame(drawVideoFrame);
      };

      video.onloadeddata = () => {
        console.log('Video loaded:', currentIndex);
        
        // Don't cancel here - let the render loop handle it
        
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
              if (onPlaybackComplete) onPlaybackComplete();
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
              if (onPlaybackComplete) onPlaybackComplete();
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
              if (onPlaybackComplete) onPlaybackComplete();
              return clipDuration;
            }
          }
        } else {
          // Handle normal duration
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
              if (onPlaybackComplete) onPlaybackComplete();
              return currentItem.duration;
            }
          }
        }
        
        return prev + 0.1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, currentIndex, currentClipIndex, items, isTransitioning]);

  // Transitions disabled - they were causing black screen issues because next images weren't preloaded
  // If you want to re-enable transitions, you'll need to preload the next image before starting the transition

  // Initial canvas setup - render first item immediately
  useEffect(() => {
    if (!canvasRef.current || items.length === 0 || currentIndex !== 0) return;
    
    console.log('Initial canvas setup');
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const firstItem = items[0];
    if (firstItem.type === "image") {
      // Use cached image if available, otherwise load it
      let img = loadedImagesRef.current.get(0);
      
      if (!img) {
        img = new Image();
        const blobUrl = URL.createObjectURL(firstItem.file);
        blobUrlsRef.current.push(blobUrl);
        img.src = blobUrl;
        
        img.onload = () => {
          loadedImagesRef.current.set(0, img!);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          const scale = Math.min(canvas.width / img!.width, canvas.height / img!.height);
          const x = (canvas.width - img!.width * scale) / 2;
          const y = (canvas.height - img!.height * scale) / 2;
          ctx.drawImage(img!, x, y, img!.width * scale, img!.height * scale);
        };
      } else {
        // Image already cached, render immediately
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      }
    } else if (firstItem.type === "titleCard" || firstItem.type === "logoCard") {
      // Handle title card or logo card
      const img = new Image();
      const blobUrl = URL.createObjectURL(firstItem.file);
      blobUrlsRef.current.push(blobUrl);
      img.src = blobUrl;
      
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (firstItem.type === "logoCard") {
          // White background for logo card
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw logo centered with contain fit
          const scale = Math.min(
            (canvas.width * 0.5) / img.width,
            (canvas.height * 0.5) / img.height
          );
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          const x = (canvas.width - scaledWidth) / 2;
          const y = (canvas.height - scaledHeight) / 2;
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        } else {
          // Title card - full display
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
          const x = (canvas.width - img.width * scale) / 2;
          const y = (canvas.height - img.height * scale) / 2;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        }
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
    // If we're at the start and have a location, show globe animation first
    if (coordinates && location && !showGlobeAnimation && !isPlaying && currentIndex === 0 && progress === 0) {
      setShowGlobeAnimation(true);
      toast.info("Starting with location animation");
      return;
    }
    
    const newPlayingState = !isPlaying;
    setIsPlaying(newPlayingState);
    
    console.log('▶️ Play/Pause:', newPlayingState);
    toast.success(newPlayingState ? "Playback started" : "Playback paused");
    
    if (videoRef.current) {
      if (newPlayingState) {
        videoRef.current.play().catch(err => {
          console.error('❌ Video play error:', err);
          toast.error("Failed to play video");
        });
      } else {
        videoRef.current.pause();
      }
    }
    
    if (audioRef.current) {
      if (newPlayingState) {
        audioRef.current.play().catch(err => {
          console.error('❌ Audio play error:', err);
          toast.error("Failed to play audio");
        });
      } else {
        audioRef.current.pause();
      }
    }
  };

  const handleGlobeAnimationComplete = () => {
    console.log('🌍 Globe animation complete');
    setShowGlobeAnimation(false);
    setIsPlaying(true);
    toast.success("Starting slideshow");
    
    // Start audio if present
    if (audioRef.current) {
      audioRef.current.play().catch(err => {
        console.error('❌ Audio play error:', err);
        toast.error("Failed to play audio");
      });
    }
  };

  const handleReset = () => {
    console.log('🔄 Reset playback');
    isRenderingRef.current = false;
    setIsPlaying(false);
    setCurrentIndex(0);
    setCurrentClipIndex(0);
    setProgress(0);
    setIsTransitioning(false);
    setTransitionProgress(0);
    setShowGlobeAnimation(false);
    setLoadingStatus("");
    setErrorMessage("");
    previousImageRef.current = null;
    
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    toast.success("Preview reset");
  };

  const seekToPosition = (targetTime: number) => {
    if (items.length === 0) return;
    
    const totalDuration = items.reduce((acc, item) => acc + item.duration, 0);
    const clampedTime = Math.max(0, Math.min(targetTime, totalDuration));
    
    let accumulatedTime = 0;
    let targetIndex = 0;
    let targetProgress = 0;
    
    // Find which slide and progress within that slide
    for (let i = 0; i < items.length; i++) {
      if (accumulatedTime + items[i].duration > clampedTime) {
        targetIndex = i;
        targetProgress = clampedTime - accumulatedTime;
        break;
      }
      accumulatedTime += items[i].duration;
    }
    
    // Update state
    setCurrentIndex(targetIndex);
    setProgress(targetProgress);
    setCurrentClipIndex(0);
    
    console.log(`⏩ Seeking to ${targetTime.toFixed(1)}s (Slide ${targetIndex + 1}, Progress ${targetProgress.toFixed(1)}s)`);
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || isDraggingRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    
    const totalDuration = items.reduce((acc, item) => acc + item.duration, 0);
    const targetTime = percentage * totalDuration;
    
    seekToPosition(targetTime);
  };

  const handleProgressBarDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !progressBarRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const dragX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, dragX / rect.width));
    
    const totalDuration = items.reduce((acc, item) => acc + item.duration, 0);
    const targetTime = percentage * totalDuration;
    
    seekToPosition(targetTime);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    setIsDragging(true);
  };

  // Add global mouse up and move listeners for drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!progressBarRef.current) return;
      
      e.preventDefault();
      
      const rect = progressBarRef.current.getBoundingClientRect();
      const dragX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, dragX / rect.width));
      
      const totalDuration = items.reduce((acc, item) => acc + item.duration, 0);
      const targetTime = percentage * totalDuration;
      
      seekToPosition(targetTime);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragging, items, seekToPosition]);

  if (items.length === 0 && (!location || !coordinates)) {
    return (
      <div className="bg-card rounded-lg border border-border flex items-center justify-center h-full">
        <p className="text-muted-foreground">No content to display</p>
      </div>
    );
  }

  const currentItem = items[currentIndex];
  const progressPercentage = currentItem && items.length > 0
    ? (progress / currentItem.duration) * 100
    : 0;
  
  // Calculate total video progress across all slides
  const totalDuration = items.reduce((acc, item) => acc + item.duration, 0);
  const elapsedTime = items.slice(0, currentIndex).reduce((acc, item) => acc + item.duration, 0) + progress;
  const totalProgressPercentage = totalDuration > 0 ? (elapsedTime / totalDuration) * 100 : 0;

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
      console.log('🧹 Cleaning up blob URLs:', blobUrlsRef.current.length);
      isRenderingRef.current = false;
      
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
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Preview canvas - Much Bigger */}
        <div className="space-y-4">
          {errorMessage && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-4 text-destructive text-sm">
              ❌ {errorMessage}
            </div>
          )}
          {loadingStatus && !errorMessage && (
            <div className="bg-primary/10 border border-primary rounded-lg p-3 text-primary text-sm animate-pulse">
              ⏳ {loadingStatus}
            </div>
          )}
          <div className="w-full aspect-video flex items-center justify-center bg-black rounded-lg overflow-hidden relative">
            <canvas
              ref={canvasRef}
              width={1920}
              height={1080}
              className="max-w-full max-h-full object-contain"
            />
            {showGlobeAnimation && coordinates && location && (
              <div className="absolute inset-0 z-20 w-full h-full pointer-events-none">
                <GlobeAnimation
                  targetLat={coordinates.lat}
                  targetLon={coordinates.lon}
                  locationName={location}
                  onComplete={handleGlobeAnimationComplete}
                />
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {showGlobeAnimation 
                  ? "🌍 Location Animation" 
                  : items.length > 0 
                    ? `Slide ${currentIndex + 1} / ${items.length}${currentItem?.type === "video" && currentItem.clips && currentItem.clips.length > 0 ? ` (Clip ${currentClipIndex + 1}/${currentItem.clips.length})` : ""}`
                    : "Ready"
                }
              </span>
              <span className="font-mono">{progress.toFixed(1)}s / {currentItem?.duration.toFixed(1) || 0}s</span>
            </div>
            
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-100"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            
            <div className="space-y-2 bg-muted/30 rounded-lg px-3 py-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="font-medium">Total Video Duration</span>
                <span className="font-mono font-semibold text-primary">
                  {(() => {
                    const globeDuration = location ? 3 : 0;
                    const baseDuration = items.reduce((acc, item) => acc + item.duration, 0);
                    const totalDuration = baseDuration + globeDuration;
                    return `${Math.round(totalDuration)}s`;
                  })()}
                </span>
              </div>
              
              <div 
                ref={progressBarRef}
                className="relative w-full bg-secondary rounded-full h-3 overflow-visible cursor-pointer group"
                onClick={handleProgressBarClick}
              >
                <div
                  className="bg-primary h-full transition-all duration-100 rounded-full"
                  style={{ width: `${Math.min(totalProgressPercentage, 100)}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-background shadow-lg cursor-grab active:cursor-grabbing hover:scale-125 transition-transform z-10"
                  style={{ left: `calc(${Math.min(totalProgressPercentage, 100)}% - 8px)` }}
                  onMouseDown={handleMouseDown}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <Button
                onClick={handlePlayPause}
                size="lg"
                className="gap-2"
                disabled={showGlobeAnimation}
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-5 w-5" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    Play
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleReset}
                size="lg"
                variant="outline"
                className="gap-2"
                disabled={showGlobeAnimation}
              >
                <RotateCcw className="h-5 w-5" />
                Reset
              </Button>
            </div>
            
            {audioFile && (
              <div className="text-center text-sm text-muted-foreground">
                🎵 Background music: {audioFile.name}
              </div>
            )}
            
            {location && coordinates && (
              <div className="text-center text-sm text-primary font-medium">
                🌍 Location animation will play first
              </div>
            )}
          </div>
        </div>
        
        {/* Video information - Below preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {videoTitle && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Video Title</h3>
              <p className="text-base font-semibold">{videoTitle}</p>
            </div>
          )}
          
          {videoDescription && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
              <p className="text-sm">{videoDescription}</p>
            </div>
          )}
          
          {location && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Location</h3>
              <p className="text-sm">{location}</p>
            </div>
          )}
          
          {videoDate && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Date</h3>
              <p className="text-sm">{videoDate}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
