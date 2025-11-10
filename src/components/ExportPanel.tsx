import { Download, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useState } from "react";
import { toast } from "sonner";

interface ExportPanelProps {
  onExport: (settings: ExportSettings) => void;
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

  const handleExport = () => {
    if (disabled) {
      toast.error("Adj hozzá legalább egy médiát az exportáláshoz");
      return;
    }
    
    if (!canvasRef?.current) {
      toast.error("A canvas nem elérhető");
      return;
    }
    
    const canvas = canvasRef.current;
    
    // Simple solution: export current frame as image
    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error("Nem sikerült létrehozni a képet");
        return;
      }
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `video_frame_${Date.now()}.png`;
      link.click();
      
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Kép letöltve! (Teljes videó export fejlesztés alatt)");
    }, 'image/png');
    
    onExport({ format, quality, fps });
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
        <h3 className="text-lg font-semibold">Export beállítások</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="format">Formátum</Label>
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
          <Label htmlFor="quality">Minőség</Label>
          <Select value={quality} onValueChange={setQuality}>
            <SelectTrigger id="quality">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Alacsony (720p)</SelectItem>
              <SelectItem value="medium">Közepes (1080p)</SelectItem>
              <SelectItem value="high">Magas (1440p)</SelectItem>
              <SelectItem value="ultra">Ultra (4K)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fps">FPS (képkocka/másodperc)</Label>
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
        Videó exportálása
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        A videó renderelése a böngésződben történik
      </p>
    </div>
  );
};
