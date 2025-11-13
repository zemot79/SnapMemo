import { useState, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ImageUploader } from "@/components/ImageUploader";
import { VideoUploader } from "@/components/VideoUploader";
import { AudioUploader } from "@/components/AudioUploader";
import { Timeline, MediaItem, TextOverlay } from "@/components/Timeline";
import { ImageEditor } from "@/components/ImageEditor";
import { VideoEditor } from "@/components/VideoEditor";
import { PreviewPanel, PreviewPanelRef } from "@/components/PreviewPanel";
import { ExportPanel, ExportSettings } from "@/components/ExportPanel";
import { VideoTitleStep } from "@/components/VideoTitleStep";
import { Stepper, Step } from "@/components/Stepper";
import { TextOverlayEditor } from "@/components/TextOverlayEditor";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
const steps: Step[] = [{
  id: 1,
  title: "Title",
  description: "Video title"
}, {
  id: 2,
  title: "Images",
  description: "Upload images"
}, {
  id: 3,
  title: "Videos",
  description: "Upload videos"
}, {
  id: 4,
  title: "Edit",
  description: "Timeline"
}, {
  id: 5,
  title: "Music",
  description: "Background music"
}, {
  id: 6,
  title: "Preview & Export",
  description: "View and save"
}];
const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewPanelRef = useRef<PreviewPanelRef>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoLocation, setVideoLocation] = useState("");
  const [videoDate, setVideoDate] = useState("");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [transitions, setTransitions] = useState<string[]>(["fade"]);
  const [textOverlayItemId, setTextOverlayItemId] = useState<string | null>(null);
  const handleTitleNext = useCallback((title: string, description: string, location: string, dateFrom: string, dateTo: string) => {
    setVideoTitle(title);
    setVideoDescription(description);
    setVideoLocation(location);
    const fullDate = dateTo ? `${dateFrom} - ${dateTo}` : dateFrom;
    setVideoDate(fullDate);
    setCurrentStep(2);
    toast.success("Title saved!");
  }, []);
  
  const createTitleCard = useCallback(async (firstImage: File, title: string, description: string, date: string): Promise<MediaItem> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error("Cannot create canvas context");
      }
      
      const img = new Image();
      img.onload = () => {
        // Draw image on left 2/3
        const imageWidth = canvas.width * (2/3);
        const scale = Math.max(imageWidth / img.width, canvas.height / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const x = (imageWidth - scaledWidth) / 2;
        const y = (canvas.height - scaledHeight) / 2;
        
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        
        // Draw white background on right 1/3
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(imageWidth, 0, canvas.width - imageWidth, canvas.height);
        
        // Draw text on right side
        const textX = imageWidth + 40;
        const textWidth = canvas.width - imageWidth - 80;
        
        // Title with gold/tan color
        ctx.fillStyle = '#b08d62';
        ctx.font = 'bold 64px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        const wrapText = (text: string, maxWidth: number, lineHeight: number, startY: number) => {
          const words = text.split(' ');
          let line = '';
          let y = startY;
          
          for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && i > 0) {
              ctx.fillText(line, textX, y);
              line = words[i] + ' ';
              y += lineHeight;
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, textX, y);
          return y + lineHeight;
        };
        
        let currentY = 150;
        currentY = wrapText(title, textWidth, 80, currentY);
        
        // Description
        currentY += 60;
        ctx.font = '36px Inter, sans-serif';
        ctx.fillStyle = '#666666';
        currentY = wrapText(description, textWidth, 50, currentY);
        
        // Date
        currentY += 80;
        ctx.font = '32px Inter, sans-serif';
        ctx.fillStyle = '#999999';
        ctx.fillText(date, textX, currentY);
        
        // Convert canvas to blob and create MediaItem
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'title-card.png', { type: 'image/png' });
            const titleCard: MediaItem = {
              id: 'title-card',
              file,
              type: 'titleCard',
              duration: 4,
              thumbnail: URL.createObjectURL(blob),
              metadata: {
                title,
                description,
                date,
              },
            };
            resolve(titleCard);
          }
        }, 'image/png');
      };
      
      img.src = URL.createObjectURL(firstImage);
    });
  }, []);
  const handleImagesAdded = useCallback(async (files: File[]) => {
    const newItems: MediaItem[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      type: "image" as const,
      duration: 3,
      thumbnail: URL.createObjectURL(file)
    }));
    
    setMediaItems(prev => {
      const combined = [...prev, ...newItems];
      // Sort by file creation time (lastModified)
      const sorted = combined.sort((a, b) => {
        // Keep titleCard first if it exists
        if (a.type === 'titleCard') return -1;
        if (b.type === 'titleCard') return 1;
        return a.file.lastModified - b.file.lastModified;
      });
      return sorted;
    });
    
    // Create title card if this is the first image and we have title data
    if (mediaItems.filter(i => i.type === 'image').length === 0 && videoTitle && files.length > 0) {
      const titleCard = await createTitleCard(files[0], videoTitle, videoDescription, videoDate);
      setMediaItems(prev => {
        // Remove old title card if exists and add new one at the start
        const withoutOldCard = prev.filter(i => i.type !== 'titleCard');
        return [titleCard, ...withoutOldCard];
      });
      toast.success(`${files.length} images added with title card`);
    } else {
      toast.success(`${files.length} images added and sorted chronologically`);
    }
  }, [videoTitle, videoDescription, videoDate, mediaItems, createTitleCard]);
  const validateVideo = (file: File): { valid: boolean; error?: string } => {
    // Supported formats
    const supportedFormats = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    const supportedExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    
    // Check file type
    const hasValidMimeType = supportedFormats.includes(file.type);
    const hasValidExtension = supportedExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    
    if (!hasValidMimeType && !hasValidExtension) {
      return {
        valid: false,
        error: `Unsupported format: ${file.name}. Please use MP4, WebM, MOV, or AVI.`
      };
    }
    
    // Check file size (max 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB in bytes
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        error: `File too large: ${file.name} (${sizeMB}MB). Maximum size is 500MB.`
      };
    }
    
    // Check minimum file size (at least 1KB to avoid empty files)
    if (file.size < 1024) {
      return {
        valid: false,
        error: `File too small or corrupted: ${file.name}`
      };
    }
    
    return { valid: true };
  };

  const handleVideosAdded = useCallback(async (files: File[]) => {
    // Validate all files first
    const validationResults = files.map(file => ({
      file,
      validation: validateVideo(file)
    }));
    
    const invalidFiles = validationResults.filter(r => !r.validation.valid);
    const validFiles = validationResults.filter(r => r.validation.valid).map(r => r.file);
    
    // Show error messages for invalid files
    if (invalidFiles.length > 0) {
      invalidFiles.forEach(({ validation }) => {
        toast.error(validation.error || 'Invalid file');
      });
    }
    
    // If no valid files, stop here
    if (validFiles.length === 0) {
      return;
    }
    
    const loadingToast = toast.loading(`Loading ${validFiles.length} video${validFiles.length > 1 ? 's' : ''}...`);
    
    try {
      const newItems: MediaItem[] = await Promise.all(
        validFiles.map(file =>
          new Promise<MediaItem>((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            
            const timeout = setTimeout(() => {
              URL.revokeObjectURL(video.src);
              console.warn(`Timeout loading metadata for ${file.name}, using default duration`);
              resolve({
                id: Math.random().toString(36).substr(2, 9),
                file,
                type: "video" as const,
                duration: 5,
                thumbnail: URL.createObjectURL(file),
                clips: []
              });
            }, 10000); // 10 second timeout
            
            video.onloadedmetadata = () => {
              clearTimeout(timeout);
              const blobUrl = video.src;
              const duration = Math.round(video.duration) || 5;
              console.log(`Loaded video: ${file.name}, duration: ${duration}s`);
              
              resolve({
                id: Math.random().toString(36).substr(2, 9),
                file,
                type: "video" as const,
                duration: duration,
                thumbnail: blobUrl, // Keep the same URL
                clips: []
              });
            };
            
            video.onerror = (e) => {
              clearTimeout(timeout);
              console.error(`Error loading video ${file.name}:`, e);
              URL.revokeObjectURL(video.src);
              resolve({
                id: Math.random().toString(36).substr(2, 9),
                file,
                type: "video" as const,
                duration: 5,
                thumbnail: URL.createObjectURL(file),
                clips: []
              });
            };
            
            video.src = URL.createObjectURL(file);
            video.load(); // Explicitly trigger load
          })
        )
      );
      
      setMediaItems(prev => {
        const combined = [...prev, ...newItems];
        return combined.sort((a, b) => a.file.lastModified - b.file.lastModified);
      });
      
      toast.dismiss(loadingToast);
      
      let successMessage = `${validFiles.length} video${validFiles.length > 1 ? 's' : ''} added`;
      if (invalidFiles.length > 0) {
        successMessage += ` (${invalidFiles.length} skipped due to errors)`;
      }
      toast.success(successMessage);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Error loading videos");
      console.error("Video loading error:", error);
    }
  }, []);
  const handleRemove = useCallback((id: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== id));
    toast.success("Item removed");
  }, []);
  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    setMediaItems(prev => {
      const newItems = [...prev];
      const [removed] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, removed);
      return newItems;
    });
    toast.success("Item reordered");
  }, []);
  const handleDurationChange = useCallback((id: string, duration: number) => {
    setMediaItems(prev => prev.map(item => item.id === id ? {
      ...item,
      duration
    } : item));
  }, []);
  const handleFocalPointChange = useCallback((id: string, focalPoint: {
    x: number;
    y: number;
  }) => {
    setMediaItems(prev => prev.map(item => item.id === id ? {
      ...item,
      focalPoint
    } : item));
    toast.success("Focal point set");
  }, []);
  const handleClipsChange = useCallback((id: string, clips: {
    id: string;
    startTime: number;
    endTime: number;
  }[]) => {
    setMediaItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const totalDuration = clips.reduce((acc, clip) => acc + (clip.endTime - clip.startTime), 0);
      return {
        ...item,
        clips,
        duration: totalDuration
      };
    }));
  }, []);

  const handleKenBurnsChange = useCallback((id: string, kenBurns: { enabled: boolean; effect: "zoomIn" | "zoomOut" | "panLeft" | "panRight" }) => {
    setMediaItems(prev => prev.map(item => item.id === id ? { ...item, kenBurns } : item));
    toast.success(`Ken Burns ${kenBurns.enabled ? 'enabled' : 'disabled'}`);
  }, []);

  const handleTextOverlayClick = useCallback((id: string) => {
    setTextOverlayItemId(id);
  }, []);

  const handleTextOverlaySave = useCallback((id: string, overlays: TextOverlay[]) => {
    setMediaItems(prev => prev.map(item => item.id === id ? { ...item, textOverlays: overlays } : item));
  }, []);
  const calculateTotalDuration = useCallback(() => {
    // Reorder items: title card first, then rest
    const orderedItems = [
      ...mediaItems.filter(item => item.type === 'titleCard'),
      ...mediaItems.filter(item => item.type !== 'titleCard')
    ];

    // Calculate total duration from all media items
    let totalDuration = orderedItems.reduce((total, item) => total + item.duration, 0);
    
    // Add 3 seconds for globe animation if location is set
    if (videoLocation && videoLocation.trim() !== "") {
      totalDuration += 3;
    }

    return totalDuration;
  }, [mediaItems, videoLocation]);

  const handleExport = useCallback((settings: ExportSettings): number => {
    console.log("Export with settings:", settings);

    const totalDuration = calculateTotalDuration();

    // Start playback
    if (previewPanelRef.current) {
      previewPanelRef.current.startPlayback();
    }
    toast.info(`Video recording starting... (${Math.ceil(totalDuration)} sec)`);
    return totalDuration;
  }, [calculateTotalDuration]);
  const getImageCount = () => mediaItems.filter(item => item.type === "image").length;
  const getVideoCount = () => mediaItems.filter(item => item.type === "video").length;
  const canGoNext = () => {
    if (currentStep === 2 && getImageCount() === 0) return false;
    if (currentStep === 3 && getVideoCount() === 0) return false;
    return currentStep < 6;
  };
  const canGoPrev = () => currentStep > 1;
  const handleNext = () => {
    if (canGoNext()) {
      setCurrentStep(prev => prev + 1);
    }
  };
  const handlePrev = () => {
    if (canGoPrev()) {
      setCurrentStep(prev => prev - 1);
    }
  };
  return <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-6">
        <Stepper steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />

        <main className="pb-8">
          {/* Step 1: Video Title */}
          {currentStep === 1 && <VideoTitleStep initialTitle={videoTitle} initialDescription={videoDescription} initialLocation={videoLocation} initialDate={videoDate} onNext={handleTitleNext} />}

          {/* Step 2: Image Upload */}
          {currentStep === 2 && <div className="max-w-6xl mx-auto space-y-6">
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-bold">Upload Images</h2>
                <p className="text-muted-foreground">
                  Add images and mark the main focal point
                </p>
                {getImageCount() > 0 && <p className="text-sm text-tertiary font-medium">
                    {getImageCount()} images added
                  </p>}
              </div>
              <ImageUploader onFilesAdded={handleImagesAdded} />
              {getImageCount() > 0 && <div className="bg-card rounded-lg border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      Click on images to set focal point
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      💡 Drag elements to reorder
                    </p>
                  </div>
                  <ImageEditor images={mediaItems.filter(item => item.type === "image")} onRemove={handleRemove} onFocalPointChange={handleFocalPointChange} onReorder={(from, to) => {
              const images = mediaItems.filter(item => item.type === "image");
              const allItems = [...mediaItems];
              const imageIndices = allItems.map((item, idx) => item.type === "image" ? idx : -1).filter(idx => idx >= 0);
              const actualFrom = imageIndices[from];
              const actualTo = imageIndices[to];
              handleReorder(actualFrom, actualTo);
            }} />
                </div>}
            </div>}

          {/* Step 3: Video Upload */}
          {currentStep === 3 && <div className="max-w-6xl mx-auto space-y-6">
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-bold">Upload Videos</h2>
                <p className="text-muted-foreground">
                  Add videos and select the important clips
                </p>
                {getVideoCount() > 0 && <p className="text-sm text-tertiary font-medium">
                    {getVideoCount()} videos added
                  </p>}
              </div>
              <VideoUploader onFilesAdded={handleVideosAdded} />
              {getVideoCount() > 0 && <div className="bg-card rounded-lg border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      Set the time ranges for important clips
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      💡 Drag elements to reorder
                    </p>
                  </div>
                  <VideoEditor videos={mediaItems.filter(item => item.type === "video")} onRemove={handleRemove} onClipsChange={handleClipsChange} onReorder={(from, to) => {
              const videos = mediaItems.filter(item => item.type === "video");
              const allItems = [...mediaItems];
              const videoIndices = allItems.map((item, idx) => item.type === "video" ? idx : -1).filter(idx => idx >= 0);
              const actualFrom = videoIndices[from];
              const actualTo = videoIndices[to];
              handleReorder(actualFrom, actualTo);
            }} />
                </div>}
            </div>}

          {/* Step 4: Timeline Editing */}
          {currentStep === 4 && <div className="max-w-6xl mx-auto space-y-6">
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-bold">Timeline Editing</h2>
                <p className="text-muted-foreground">
                  Reorder elements and set durations
                </p>
                <div className="flex gap-4 justify-center text-sm">
                  <span className="text-tertiary font-medium">
                    {getImageCount()} images
                  </span>
                  <span className="text-tertiary font-medium">
                    {getVideoCount()} videos
                  </span>
                </div>
              </div>
              
              {/* Timeline Section */}
              <div className="bg-card rounded-lg border border-border p-6">
                <Timeline 
                  items={mediaItems} 
                  onRemove={handleRemove} 
                  onReorder={handleReorder} 
                  onDurationChange={handleDurationChange}
                  onKenBurnsChange={handleKenBurnsChange}
                  onTextOverlayClick={handleTextOverlayClick}
                  location={videoLocation} 
                />
              </div>

              {/* Transitions Section */}
              <div className="bg-card rounded-lg border border-border p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-tertiary/10 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-tertiary"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" /></svg>
                    </div>
                    <h3 className="text-lg font-semibold">Transitions</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Select the transition types you want to use in the video. They will appear in random order.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[{
                  id: "fade",
                  name: "Fade"
                }, {
                  id: "slideLeft",
                  name: "Slide Left"
                }, {
                  id: "slideRight",
                  name: "Slide Right"
                }, {
                  id: "zoomIn",
                  name: "Zoom In"
                }, {
                  id: "zoomOut",
                  name: "Zoom Out"
                }, {
                  id: "wipe",
                  name: "Wipe"
                }].map(transition => <div key={transition.id} className="flex items-center space-x-2 p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors">
                        <input type="checkbox" id={`transition-${transition.id}`} checked={transitions.includes(transition.id)} onChange={() => {
                    const newTransitions = transitions.includes(transition.id) ? transitions.filter(t => t !== transition.id) : [...transitions, transition.id];
                    setTransitions(newTransitions);
                  }} className="h-4 w-4 rounded border-border text-tertiary focus:ring-tertiary" />
                        <label htmlFor={`transition-${transition.id}`} className="text-sm font-medium leading-none cursor-pointer flex-1">
                          {transition.name}
                        </label>
                      </div>)}
                  </div>
                </div>
              </div>
            </div>}

          {/* Step 5: Audio Upload */}
          {currentStep === 5 && <div className="max-w-2xl mx-auto space-y-6">
              <AudioUploader audios={audioFiles} onAudioAdded={file => setAudioFiles(prev => [...prev, file])} onAudioRemoved={index => setAudioFiles(prev => prev.filter((_, i) => i !== index))} />
            </div>}

          {/* Step 6: Preview & Export */}
          {currentStep === 6 && <div className="max-w-6xl mx-auto space-y-6">
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-bold">Preview and Export</h2>
                <p className="text-muted-foreground">
                  View the video and download it
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <PreviewPanel 
                    ref={previewPanelRef} 
                    items={[
                      ...mediaItems.filter(item => item.type === 'titleCard'),
                      ...mediaItems.filter(item => item.type !== 'titleCard')
                    ]} 
                    audioFile={audioFiles.length > 0 ? audioFiles[0] : null} 
                    transitions={transitions} 
                    location={videoLocation} 
                    videoTitle={videoTitle} 
                    videoDescription={videoDescription} 
                    videoDate={videoDate} 
                    canvasRef={canvasRef} 
                  />
                </div>
                
                <div className="lg:col-span-1">
                  <ExportPanel onExport={handleExport} disabled={mediaItems.length === 0} canvasRef={canvasRef} totalDuration={calculateTotalDuration()} />
                </div>
              </div>
            </div>}

          {/* Navigation Buttons */}
          {currentStep > 1 && <div className="flex justify-between max-w-6xl mx-auto mt-8">
              <Button onClick={handlePrev} variant="outline" size="lg" disabled={!canGoPrev()} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              {currentStep < 6 && <Button onClick={handleNext} size="lg" disabled={!canGoNext()} className="gap-2">
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>}
            </div>}
        </main>
      </div>

      {/* Text Overlay Editor Dialog */}
      {textOverlayItemId && (() => {
        const item = mediaItems.find(i => i.id === textOverlayItemId);
        return item ? (
          <TextOverlayEditor
            itemId={item.id}
            itemName={item.file.name}
            overlays={item.textOverlays || []}
            onSave={(overlays) => handleTextOverlaySave(item.id, overlays)}
            onClose={() => setTextOverlayItemId(null)}
          />
        ) : null;
      })()}

      <Footer />
    </div>;
};
export default Index;