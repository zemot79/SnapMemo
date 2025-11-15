import { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ArrowRight, Film } from "lucide-react";
import { getThemeById } from "@/lib/themes";

interface VideoTitleStepProps {
  initialTitle?: string;
  initialDescription?: string;
  initialLocation?: string;
  initialDate?: string;
  onNext: (title: string, description: string, location: string, dateFrom: string, dateTo: string) => void;
  selectedTheme?: string;
}

export const VideoTitleStep = ({
  initialTitle = "",
  initialDescription = "",
  initialLocation = "",
  initialDate = "",
  onNext,
  selectedTheme = "classic",
}: VideoTitleStepProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [location, setLocation] = useState(initialLocation);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = getThemeById(selectedTheme);
  
  // Parse initial date - format is "YYYY-MM"
  const parseMonth = (dateStr: string) => {
    if (!dateStr) return { year: "", month: "" };
    const cleanDate = dateStr.includes(" - ") ? dateStr.split(" - ")[0] : dateStr;
    const parts = cleanDate.split("-");
    return { year: parts[0] || "", month: parts[1] || "" };
  };
  
  const parsedDate = parseMonth(initialDate);
  const [year, setYear] = useState(parsedDate.year);
  const [month, setMonth] = useState(parsedDate.month);

  const handleNext = () => {
    if (title.trim()) {
      const dateStr = year && month ? `${year}-${month}` : "";
      onNext(title, description, location, dateStr, "");
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);
  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  // Generate preview of title card
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background gradient
    if (theme.gradient) {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, theme.colors.background);
      gradient.addColorStop(1, theme.colors.accent);
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = theme.colors.background;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw placeholder image area on left
    const imageWidth = canvas.width * (2/3);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, imageWidth, canvas.height);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '24px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Your first image', imageWidth / 2, canvas.height / 2 - 10);
    ctx.fillText('will appear here', imageWidth / 2, canvas.height / 2 + 20);
    
    // Draw text area on right
    const textX = imageWidth + 20;
    const textWidth = canvas.width - imageWidth - 40;
    
    // Title
    if (title) {
      ctx.fillStyle = theme.colors.primary;
      ctx.font = 'bold 32px Arial, sans-serif';
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
      
      let currentY = 75;
      currentY = wrapText(title, textWidth, 40, currentY);
      
      // Description
      if (description) {
        currentY += 30;
        ctx.font = '18px Arial, sans-serif';
        ctx.fillStyle = theme.colors.text;
        currentY = wrapText(description, textWidth, 25, currentY);
      }
      
      // Date
      const dateStr = year && month ? `${year}-${month}` : '';
      if (dateStr) {
        currentY += 40;
        ctx.font = '16px Arial, sans-serif';
        ctx.fillStyle = theme.colors.secondary;
        ctx.fillText(dateStr, textX, currentY);
      }
    } else {
      // Show placeholder text
      ctx.fillStyle = theme.colors.text;
      ctx.font = '24px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Preview will appear', canvas.width * 5/6, canvas.height / 2 - 10);
      ctx.fillText('when you enter a title', canvas.width * 5/6, canvas.height / 2 + 20);
    }
  }, [title, description, year, month, theme]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <div className="bg-card rounded-lg border border-border p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-primary/10 rounded-full mb-2">
              <Film className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">New Video Project</h2>
            <p className="text-muted-foreground">
              Enter your video title and a brief description
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Video Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Summer Vacation 2024"
                className="text-lg"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write a short description of the video..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Budapest, Hungary"
              />
            </div>

            <div className="space-y-2">
              <Label>Date (optional)</Label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Month</option>
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <Button
            onClick={handleNext}
            disabled={!title.trim()}
            className="w-full"
            size="lg"
          >
            Continue to Images
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Preview Section */}
        <div className="bg-card rounded-lg border border-border p-8 space-y-4">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">Title Card Preview</h3>
            <p className="text-sm text-muted-foreground">
              This is how your title card will look
            </p>
          </div>
          
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              width={960}
              height={540}
              className="w-full h-full object-contain"
            />
          </div>
          
          <div className="text-xs text-muted-foreground text-center">
            Your first uploaded image will replace the placeholder
          </div>
        </div>
      </div>
    </div>
  );
};
