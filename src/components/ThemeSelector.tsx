import { themes, ColorTheme } from "@/lib/themes";
import { Card } from "./ui/card";
import { Check } from "lucide-react";

interface ThemeSelectorProps {
  selectedTheme: string;
  onThemeChange: (themeId: string) => void;
}

export const ThemeSelector = ({ selectedTheme, onThemeChange }: ThemeSelectorProps) => {
  return (
    <div className="space-y-3 mb-6">
      <h3 className="text-sm font-semibold text-foreground">Color Theme</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {themes.map((theme) => (
          <Card
            key={theme.id}
            className={`p-3 cursor-pointer transition-all hover:scale-105 ${
              selectedTheme === theme.id
                ? "ring-2 ring-primary shadow-lg"
                : "hover:shadow-md"
            }`}
            onClick={() => onThemeChange(theme.id)}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-semibold text-xs text-foreground truncate">
                    {theme.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">
                    {theme.description}
                  </p>
                </div>
                {selectedTheme === theme.id && (
                  <div className="flex-shrink-0">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                )}
              </div>
              
              <div className="flex gap-1.5">
                <div
                  className="w-6 h-6 rounded-full border border-border"
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <div
                  className="w-6 h-6 rounded-full border border-border"
                  style={{ backgroundColor: theme.colors.secondary }}
                />
                <div
                  className="w-6 h-6 rounded-full border border-border"
                  style={{ backgroundColor: theme.colors.accent }}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
