import { useEffect, useRef } from "react";
import { getThemeById } from "@/lib/themes";
import { TitleCardSettings } from "./TitleCardCustomizer";

interface TitleCardPreviewProps {
  firstImage?: File | null;
  title: string;
  description: string;
  date: string;
  settings: TitleCardSettings;
  selectedTheme: string;
}

export const TitleCardPreview = ({
  firstImage,
  title,
  description,
  date,
  settings,
  selectedTheme,
}: TitleCardPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = getThemeById(selectedTheme);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // If no image → Placeholder
    if (!firstImage) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "white";
      ctx.font = "32px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Upload an image to preview the Title Card", canvas.width / 2, canvas.height / 2);
      return;
    }

    const img = new Image();
    img.src = URL.createObjectURL(firstImage);

    img.onload = () => {
      const imageWidth = canvas.width * (2 / 3);

      // Draw left side: first image
      const scale = Math.max(
        imageWidth / img.width,
        canvas.height / img.height
      );
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const imgX = (imageWidth - scaledWidth) / 2;
      const imgY = (canvas.height - scaledHeight) / 2;

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, imgX, imgY, scaledWidth, scaledHeight);

      // Draw right gradient panel
      if (theme.gradient) {
        const g = ctx.createLinearGradient(imageWidth, 0, canvas.width, canvas.height);
        const colors = theme.gradient.match(/#[0-9a-f]{6}/gi) || [
          theme.colors.primary,
          theme.colors.secondary,
        ];
        g.addColorStop(0, colors[0]);
        g.addColorStop(1, colors[colors.length - 1]);
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = theme.colors.background;
      }

      ctx.fillRect(imageWidth, 0, canvas.width - imageWidth, canvas.height);

      // Draw texts
      const textX = imageWidth + 40;
      const textWidth = canvas.width - imageWidth - 80;

      const wrap = (text: string, size: number, color: string, y: number) => {
        ctx.font = `${size}px Arial`;
        ctx.fillStyle = color;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";

        const words = text.split(" ");
        let line = "";
        let yy = y;

        for (let word of words) {
          const test = line + word + " ";
          if (ctx.measureText(test).width > textWidth) {
            ctx.fillText(line, textX, yy);
            line = word + " ";
            yy += size * 1.4;
          } else {
            line = test;
          }
        }
        ctx.fillText(line, textX, yy);
      };

      // Title
      if (title) wrap(title, settings.titleFontSize, settings.titleColor, settings.titleY);

      // Description
      if (description) wrap(description, settings.descriptionFontSize, settings.descriptionColor, settings.descriptionY);

      // Date
      if (date) {
        ctx.font = `${settings.dateFontSize}px Arial`;
        ctx.fillStyle = settings.dateColor;
        ctx.fillText(date, textX, settings.dateY);
      }
    };
  }, [firstImage, title, description, date, settings, selectedTheme]);

  return (
    <canvas
      ref={canvasRef}
      width={1920}
      height={1080}
      className="w-full h-full object-contain rounded-lg bg-black"
    />
  );
};
