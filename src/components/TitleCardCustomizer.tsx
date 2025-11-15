import React from "react";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Input } from "./ui/input";
import { Settings2 } from "lucide-react";

export interface TitleCardSettings {
  titleFontSize: number;
  titleColor: string;
  titleY: number;
  descriptionFontSize: number;
  descriptionColor: string;
  descriptionY: number;
  dateFontSize: number;
  dateColor: string;
  dateY: number;
}

interface TitleCardCustomizerProps {
  settings: TitleCardSettings;
  onChange: (settings: TitleCardSettings) => void;
}

export const TitleCardCustomizer: React.FC<TitleCardCustomizerProps> = ({
  settings,
  onChange,
}) => {
  const updateSetting = (key: keyof TitleCardSettings, value: number | string) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <Card className="p-4 bg-background/95 backdrop-blur">
      <div className="flex items-center gap-2 mb-4">
        <Settings2 className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Title Card Customization</h3>
      </div>

      <div className="space-y-6">
        {/* Title Settings */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">Title</Label>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Label className="text-xs text-muted-foreground w-20">Size</Label>
              <Slider
                value={[settings.titleFontSize]}
                onValueChange={([value]) => updateSetting("titleFontSize", value)}
                min={32}
                max={128}
                step={4}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-12">{settings.titleFontSize}px</span>
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-xs text-muted-foreground w-20">Color</Label>
              <Input
                type="color"
                value={settings.titleColor}
                onChange={(e) => updateSetting("titleColor", e.target.value)}
                className="w-20 h-8"
              />
              <span className="text-xs text-muted-foreground flex-1">{settings.titleColor}</span>
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-xs text-muted-foreground w-20">Position Y</Label>
              <Slider
                value={[settings.titleY]}
                onValueChange={([value]) => updateSetting("titleY", value)}
                min={50}
                max={500}
                step={10}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-12">{settings.titleY}px</span>
            </div>
          </div>
        </div>

        {/* Description Settings */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">Description</Label>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Label className="text-xs text-muted-foreground w-20">Size</Label>
              <Slider
                value={[settings.descriptionFontSize]}
                onValueChange={([value]) => updateSetting("descriptionFontSize", value)}
                min={20}
                max={72}
                step={2}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-12">{settings.descriptionFontSize}px</span>
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-xs text-muted-foreground w-20">Color</Label>
              <Input
                type="color"
                value={settings.descriptionColor}
                onChange={(e) => updateSetting("descriptionColor", e.target.value)}
                className="w-20 h-8"
              />
              <span className="text-xs text-muted-foreground flex-1">{settings.descriptionColor}</span>
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-xs text-muted-foreground w-20">Position Y</Label>
              <Slider
                value={[settings.descriptionY]}
                onValueChange={([value]) => updateSetting("descriptionY", value)}
                min={100}
                max={700}
                step={10}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-12">{settings.descriptionY}px</span>
            </div>
          </div>
        </div>

        {/* Date Settings */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">Date</Label>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Label className="text-xs text-muted-foreground w-20">Size</Label>
              <Slider
                value={[settings.dateFontSize]}
                onValueChange={([value]) => updateSetting("dateFontSize", value)}
                min={16}
                max={64}
                step={2}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-12">{settings.dateFontSize}px</span>
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-xs text-muted-foreground w-20">Color</Label>
              <Input
                type="color"
                value={settings.dateColor}
                onChange={(e) => updateSetting("dateColor", e.target.value)}
                className="w-20 h-8"
              />
              <span className="text-xs text-muted-foreground flex-1">{settings.dateColor}</span>
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-xs text-muted-foreground w-20">Position Y</Label>
              <Slider
                value={[settings.dateY]}
                onValueChange={([value]) => updateSetting("dateY", value)}
                min={150}
                max={900}
                step={10}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-12">{settings.dateY}px</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
