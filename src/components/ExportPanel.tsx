import { Download, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useState } from "react";
import { toast } from "sonner";

interface ExportPanelProps {
  onExport: (settings: ExportSettings) => number;
  disabled: boolean;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
}

export interface ExportSettings {
  format: string;
  quality: string;
  fps: number;
}

export const ExportPanel = ({ onExport, disabled, canvasRef }: ExportPanelProps) => {
  const [format, setFormat] = useState("mp4");
  const [quality, setQuality] = useState("high");
  const [fps, setFps] = useState(30);

  const handleExport = async () => {
    if (disabled) {
      toast.error("Add at least one media item to export");
      return;
    }
    
    if (!canvasRef?.current) {
      toast.error("Canvas not available");
      return;
    }
    
    try {
      const canvas = canvasRef.current;
      
      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        toast.error("Browser does not support video recording");
        return;
      }
      
      // Calculate total video duration
      const totalDuration = onExport({ format, quality, fps });
      const durationMs = totalDuration * 1000;
      
      // Start recording
      const stream = canvas.captureStream(fps);
      
      let mimeType = 'video/webm';
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        mimeType = 'video/webm;codecs=vp9';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        mimeType = 'video/webm;codecs=vp8';
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
        a.download = `video_${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        
        stream.getTracks().forEach(track => track.stop());
        toast.success("Video downloaded!");
      };
      
      recorder.onerror = (e) => {
        console.error('Recorder error:', e);
        toast.error("Error during recording");
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      recorder.start(100);
      toast.info(`Recording in progress... ${Math.ceil(totalDuration)} seconds`);
      
      // Stop after total duration
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, durationMs + 500); // Add 500ms buffer
      
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Error during export");
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

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Export Settings</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="format">Format</Label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger id="format">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mp4">MP4 (H.264)</SelectItem>
              <SelectItem value="webm">WebM (VP9)</SelectItem>
              <SelectItem value="mov">MOV (ProRes)</SelectItem>
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
              <SelectItem value="low">Low (720p)</SelectItem>
              <SelectItem value="medium">Medium (1080p)</SelectItem>
              <SelectItem value="high">High (1440p)</SelectItem>
              <SelectItem value="ultra">Ultra (4K)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fps">FPS (frames per second)</Label>
          <Input
            id="fps"
            type="number"
            value={fps}
            onChange={(e) => setFps(Number(e.target.value))}
            min="24"
            max="60"
          />
        </div>
      </div>

      <Button
        onClick={handleExport}
        disabled={disabled}
        className="w-full gap-2"
        size="lg"
      >
        <Download className="w-4 h-4" />
        Export Video
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Video rendering happens in your browser
      </p>
    </div>
  );
};
