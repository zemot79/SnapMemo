import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sun,
  Flame,
  Mountain,
  Film,
  Zap,
  Circle,
  PanelsTopLeft,
} from "lucide-react";

export interface ThemePreset {
  id: string;
  label: string;
  description: string;
  previewColor: string;
  icon: React.ReactNode;
}

interface ThemesSelectorProps {
  defaultTheme?: string;
  onChange?: (themeId: string) => void;
}

const THEMES: ThemePreset[] = [
  {
    id: "metro",
    label: "Metro",
    description: "Modern, clean, fast cuts",
    previewColor: "bg-blue-500",
    icon: <PanelsTopLeft className="w-5 h-5 text-blue-300" />,
  },
  {
    id: "sol",
    label: "Sol",
    description: "Warm, sunny, vibrant tones",
    previewColor: "bg-yellow-500",
    icon: <Sun className="w-5 h-5 text-yellow-200" />,
  },
  {
    id: "heat",
    label: "Heat",
    description: "High-contrast energetic look",
    previewColor: "bg-red-500",
    icon: <Flame className="w-5 h-5 text-red-300" />,
  },
  {
    id: "travel",
    label: "Travel",
    description: "Cinematic teal & orange trip",
    previewColor: "bg-teal-500",
    icon: <Mountain className="w-5 h-5 text-teal-200" />,
  },
  {
    id: "film-damage",
    label: "Film Damage",
    description: "Vintage, scratched film look",
    previewColor: "bg-neutral-600",
    icon: <Film className="w-5 h-5 text-gray-300" />,
  },
  {
    id: "action",
    label: "Action",
    description: "Punchy sports-focused motion",
    previewColor: "bg-purple-600",
    icon: <Zap className="w-5 h-5 text-purple-300" />,
  },
  {
    id: "neutral",
    label: "Classic Neutral",
    description: "Clean baseline look",
    previewColor: "bg-gray-400",
    icon: <Circle className="w-5 h-5 text-gray-200" />,
  },
];

export const ThemesSelector = ({
  defaultTheme = "neutral",
  onChange,
}: ThemesSelectorProps) => {
  const [selected, setSelected] = useState(defaultTheme);

  const selectTheme = (id: string) => {
    setSelected(id);
    onChange?.(id);
  };

  return (
    <Card className="p-4 space-y-4">
      {/* HEADER */}
      <div>
        <h3 className="text-base font-semibold">Themes</h3>
        <p className="text-xs text-muted-foreground">
          Choose one visual style preset for your video.
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {THEMES.map((t) => {
          const active = selected === t.id;
          return (
            <button
              key={t.id}
              onClick={() => selectTheme(t.id)}
              className={[
                "rounded-lg border p-3 text-left transition relative group",
                active
                  ? "border-primary shadow-lg"
                  : "border-border hover:border-primary/40",
              ].join(" ")}
            >
              {/* PREVIEW BLOCK */}
              <div
                className={`w-full h-24 rounded-md ${t.previewColor} relative overflow-hidden`}
              >
                {/* subtle vignette */}
                <div className="absolute inset-0 bg-black/20" />

                {/* icon overlay */}
                <div className="absolute bottom-2 left-2 opacity-80">
                  {t.icon}
                </div>

                {/* Active highlight ring */}
                {active && (
                  <div className="absolute inset-0 border-[3px] border-primary rounded-md pointer-events-none" />
                )}
              </div>

              {/* LABEL + DESCRIPTION */}
              <div className="mt-3">
                <p className="font-medium text-sm">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* RESET BUTTON */}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => selectTheme("neutral")}
      >
        Reset to neutral
      </Button>
    </Card>
  );
};

