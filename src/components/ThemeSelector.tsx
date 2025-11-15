import { themes, ColorTheme } from "@/lib/themes";
import { Card } from "./ui/card";
import { Check, Palette } from "lucide-react";

interface ThemeSelectorProps {
  selectedTheme: string;
  onThemeChange: (themeId: string) => void;
}

export const ThemeSelector = ({ selectedTheme, onThemeChange }: ThemeSelectorProps) => {
  return (
    <div className="border border-border rounded-lg p-6 bg-card mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-5 h-5 text-primary" />
        <h3 className="text-base font-semibold text-foreground">Color Theme</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map((theme) => (
          <Card
            key={theme.id}
            className={`cursor-pointer transition-all overflow-hidden ${
              selectedTheme === theme.id
                ? "ring-2 ring-primary shadow-lg scale-[1.02]"
                : "hover:shadow-md hover:scale-[1.01]"
            }`}
            onClick={() => onThemeChange(theme.id)}
          >
            {/* Theme preview banner */}
            <div 
              className="h-24 w-full relative"
              style={{
                background: theme.gradient || `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`
              }}
            >
              {/* Sample text overlay to show how it looks */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className="text-center px-4"
                  style={{ color: theme.colors.text }}
                >
                  <p className="font-bold text-lg mb-1" style={{ 
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    color: theme.id === 'classic' || theme.id === 'earth' || theme.id === 'sunset' ? theme.colors.text : '#ffffff'
                  }}>
                    Your Video
                  </p>
                  <p className="text-xs opacity-90" style={{ 
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    color: theme.id === 'classic' || theme.id === 'earth' || theme.id === 'sunset' ? theme.colors.text : '#ffffff'
                  }}>
                    Preview
                  </p>
                </div>
              </div>
              
              {/* Check mark indicator */}
              {selectedTheme === theme.id && (
                <div className="absolute top-2 right-2 bg-primary rounded-full p-1 shadow-lg">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
            
            {/* Theme details */}
            <div className="p-4 space-y-3">
              <div>
                <p className="font-semibold text-sm text-foreground">
                  {theme.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {theme.description}
                </p>
              </div>
              
              {/* Color palette */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Palette:</span>
                <div className="flex gap-1.5">
                  <div
                    className="w-5 h-5 rounded border border-border shadow-sm"
                    style={{ backgroundColor: theme.colors.primary }}
                    title="Primary"
                  />
                  <div
                    className="w-5 h-5 rounded border border-border shadow-sm"
                    style={{ backgroundColor: theme.colors.secondary }}
                    title="Secondary"
                  />
                  <div
                    className="w-5 h-5 rounded border border-border shadow-sm"
                    style={{ backgroundColor: theme.colors.accent }}
                    title="Accent"
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
