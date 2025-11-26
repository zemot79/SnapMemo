import React from "react";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

interface ThemeSelectorProps {
  selectedTheme: string;
  onThemeChange: (id: string) => void;
}

type Theme = {
  id: string;
  name: string;
  preview: string; // preview kép
  colors: string[];
};

const THEMES: Theme[] = [
  {
    id: "classicNeutral",
    name: "Classic Neutral",
    preview: "https://images.unsplash.com/photo-1558981403-c5f9891b6d2d?w=600",
    colors: ["#d1d5db", "#9ca3af", "#6b7280"],
  },
  {
    id: "dopamineBrights",
    name: "Dopamine Brights",
    preview: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600",
    colors: ["#f43f5e", "#f97316", "#22c55e"],
  },
  {
    id: "cyberpunkNeon",
    name: "Cyberpunk Neon",
    preview: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600",
    colors: ["#0ea5e9", "#9333ea", "#f43f5e"],
  },
  {
    id: "earthSage",
    name: "Earth & Sage",
    preview: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600",
    colors: ["#4d7c0f", "#a3e635", "#d9f99d"],
  },
  {
    id: "deepOcean",
    name: "Deep Ocean",
    preview: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600",
    colors: ["#0ea5e9", "#1e3a8a", "#0f172a"],
  },
  {
    id: "sunsetGradient",
    name: "Sunset Gradient",
    preview: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600",
    colors: ["#fb923c", "#f43f5e", "#ec4899"],
  },
];

export const ThemeSelector = ({
  selectedTheme,
  onThemeChange,
}: ThemeSelectorProps) => {
  return (
    <Card className="p-5 space-y-4 border-border">
      <div>
        <h3 className="text-base font-semibold">Color Theme</h3>
        <p className="text-xs text-muted-foreground">
          Choose a visual color style for your video.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {THEMES.map((theme) => {
          const active = selectedTheme === theme.id;

          return (
            <button
              key={theme.id}
              onClick={() => onThemeChange(theme.id)}
              className={[
                "relative group rounded-2xl overflow-hidden border",
                active
                  ? "border-primary shadow-lg"
                  : "border-border hover:border-primary/50",
              ].join(" ")}
            >
              {/* Preview image */}
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={theme.preview}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  alt={theme.name}
                />
              </div>

              {/* Name */}
              <div className="p-3 text-left">
                <p className="text-sm font-semibold">{theme.name}</p>

                <div className="flex gap-1 mt-1">
                  {theme.colors.map((c, idx) => (
                    <div
                      key={idx}
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Active checkmark */}
              {active && (
                <div className="absolute top-2 right-2 bg-primary text-white p-1 rounded-full shadow-md">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
};
