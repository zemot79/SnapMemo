import { Download, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Progress } from "./ui/progress";
import { useState } from "react";
import { toast } from "sonner";

interface ExportPanelProps {
  onExport: (settings: ExportSettings) => number;
  disabled: boolean;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  totalDuration?: number;
}

export interface ExportSettings {
  format: string;
  quality: string;
}

export const ExportPanel = ({ onExport, disabled, canvasRef, totalDuration = 0 }: ExportPanelProps) => {
  const [format, setFormat] = useState("webm");
  const [quality, setQuality] = useState("high");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const fps = 30; // Fixed at 30 FPS

  const handleExport = async () => {
    if (disabled) {
      toast.error("Add at least one media item to export");
      return;
    }
    
    if (!canvasRef?.current) {
      toast.error("Canvas not available");
      return;
    }
    
    // Warn about format limitations
    if (format !== 'webm') {
      toast.warning("Only WebM format is fully supported. File will be saved as WebM.");
    }
    
    try {
      const canvas = canvasRef.current;
      
      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        toast.error("Browser does not support video recording");
        return;
      }
      
      // Calculate total video duration
      const totalDuration = onExport({ format, quality });
      const durationMs = totalDuration * 1000;
      
      setIsRecording(true);
      setRecordingProgress(0);
      toast.info("Starting video capture...");
      
      // Start recording
      const stream = canvas.captureStream(fps);
      
      let mimeType = 'video/webm';
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        mimeType = 'video/webm;codecs=vp9';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        mimeType = 'video/webm;codecs=vp8';
      } else {
        toast.error("Browser doesn't support WebM recording");
        setIsRecording(false);
        return;
      }
      
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: getBitrate(quality),
      });
      
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        // Always save as .webm since that's what MediaRecorder produces
        a.download = `video_${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setRecordingProgress(0);
        toast.success("Video downloaded as WebM!");
      };
      
      recorder.onerror = (e) => {
        console.error('Recorder error:', e);
        toast.error("Error during recording");
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setRecordingProgress(0);
      };
      
      // Start recording
      recorder.start(100);
      toast.success(`Recording ${Math.ceil(totalDuration)}s video at ${quality} quality`);
      
      // Update progress
      const progressInterval = setInterval(() => {
        setRecordingProgress((prev) => {
          const newProgress = prev + (100 / (durationMs / 100));
          return Math.min(newProgress, 100);
        });
      }, 100);
      
      // Stop after total duration
      setTimeout(() => {
        clearInterval(progressInterval);
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, durationMs + 500); // Add 500ms buffer
      
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Error during export");
      setIsRecording(false);
      setRecordingProgress(0);
    }
  };
  
  const getBitrate = (quality: string): number => {
    switch (quality) {
      case 'low': return 2500000;
      case 'medium': return 5000000;
      case 'high': return 10000000;
      case 'ultra': return 20000000;
      default: return 5000000;
    }
  };
  
  const getEstimatedSize = (qualityLevel: string): string => {
    if (totalDuration === 0) return "~";
    const bitrate = getBitrate(qualityLevel);
    const sizeInMB = (bitrate * totalDuration) / (8 * 1024 * 1024);
    return `~${sizeInMB.toFixed(1)} MB`;
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Export Settings</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="aspectRatio">Format</Label>
          <Select value={aspectRatio} onValueChange={setAspectRatio}>
            <SelectTrigger id="aspectRatio">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4:5">4:5 - Instagram, Facebook</SelectItem>
              <SelectItem value="16:9">16:9 - TV, Monitor, Mobile landscape</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fileType">File type</Label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger id="fileType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="webm">WebM (Browser native)</SelectItem>
              <SelectItem value="mp4">MP4 (Saved as WebM)*</SelectItem>
              <SelectItem value="mov">MOV (Saved as WebM)*</SelectItem>
              <SelectItem value="wmv">WMV (Saved as WebM)*</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quality">Quality</Label>
          <Select value={quality} onValueChange={setQuality}>
            <SelectTrigger id="quality">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">
                <div className="flex justify-between items-center w-full gap-4">
                  <span>Low (720p)</span>
                  <span className="text-xs text-muted-foreground">{getEstimatedSize('low')}</span>
                </div>
              </SelectItem>
              <SelectItem value="medium">
                <div className="flex justify-between items-center w-full gap-4">
                  <span>Medium (1080p)</span>
                  <span className="text-xs text-muted-foreground">{getEstimatedSize('medium')}</span>
                </div>
              </SelectItem>
              <SelectItem value="high">
                <div className="flex justify-between items-center w-full gap-4">
                  <span>High (1440p)</span>
                  <span className="text-xs text-muted-foreground">{getEstimatedSize('high')}</span>
                </div>
              </SelectItem>
              <SelectItem value="ultra">
                <div className="flex justify-between items-center w-full gap-4">
                  <span>Ultra (4K)</span>
                  <span className="text-xs text-muted-foreground">{getEstimatedSize('ultra')}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isRecording && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Recording...</span>
            <span className="font-medium">{Math.round(recordingProgress)}%</span>
          </div>
          <Progress value={recordingProgress} />
        </div>
      )}

      <Button
        onClick={handleExport}
        disabled={disabled || isRecording}
        className="w-full gap-2"
        size="lg"
      >
        <Download className="w-4 h-4" />
        {isRecording ? "Recording..." : "Export Video"}
      </Button>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground text-center">
          Video rendering happens in your browser
        </p>
        <p className="text-xs text-muted-foreground text-center">
          *Browser only supports WebM export. Convert to other formats using external tools.
        </p>
      </div>
    </div>
  );
};
