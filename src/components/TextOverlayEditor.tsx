import { useState } from "react";
import { TextOverlay } from "./Timeline";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Plus, X, Type } from "lucide-react";
import { toast } from "sonner";
import { getThemeById } from "@/lib/themes";

interface TextOverlayEditorProps {
  itemId: string;
  itemName: string;
  overlays: TextOverlay[];
  onSave: (overlays: TextOverlay[]) => void;
  onClose: () => void;
  selectedTheme?: string;
}

export const TextOverlayEditor = ({
  itemId,
  itemName,
  overlays: initialOverlays,
  onSave,
  onClose,
  selectedTheme = "classic",
}: TextOverlayEditorProps) => {
  const [overlays, setOverlays] = useState<TextOverlay[]>(initialOverlays);
  const theme = getThemeById(selectedTheme);

  const addOverlay = () => {
    const newOverlay: TextOverlay = {
      id: Math.random().toString(36).substr(2, 9),
      text: "New Text",
      x: 50,
      y: 85,
      fontSize: 48,
      fontFamily: "Inter",
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
      opacity: 0.8,
    };
    setOverlays([...overlays, newOverlay]);
    toast.success("Text overlay added");
  };

  const removeOverlay = (id: string) => {
    setOverlays(overlays.filter((o) => o.id !== id));
    toast.success("Text overlay removed");
  };

  const updateOverlay = (id: string, updates: Partial<TextOverlay>) => {
    setOverlays(
      overlays.map((o) => (o.id === id ? { ...o, ...updates } : o))
    );
  };

  const handleSave = () => {
    onSave(overlays);
    toast.success("Text overlays saved");
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            Text Overlays
          </DialogTitle>
          <DialogDescription>
            Add text, captions, or watermarks to {itemName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {overlays.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Type className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No text overlays yet</p>
              <p className="text-sm mt-1">Click "Add Text" to get started</p>
            </div>
          )}

          {overlays.map((overlay, index) => (
            <div
              key={overlay.id}
              className="p-4 border border-border rounded-lg space-y-3 bg-secondary/30"
            >
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Text #{index + 1}</Label>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOverlay(overlay.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label htmlFor={`text-${overlay.id}`}>Text Content</Label>
                  <Input
                    id={`text-${overlay.id}`}
                    value={overlay.text}
                    onChange={(e) =>
                      updateOverlay(overlay.id, { text: e.target.value })
                    }
                    placeholder="Enter text..."
                  />
                </div>

                <div>
                  <Label htmlFor={`x-${overlay.id}`}>X Position (%)</Label>
                  <Input
                    id={`x-${overlay.id}`}
                    type="number"
                    value={overlay.x}
                    onChange={(e) =>
                      updateOverlay(overlay.id, { x: Number(e.target.value) })
                    }
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <Label htmlFor={`y-${overlay.id}`}>Y Position (%)</Label>
                  <Input
                    id={`y-${overlay.id}`}
                    type="number"
                    value={overlay.y}
                    onChange={(e) =>
                      updateOverlay(overlay.id, { y: Number(e.target.value) })
                    }
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <Label htmlFor={`font-${overlay.id}`}>Font</Label>
                  <Select
                    value={overlay.fontFamily}
                    onValueChange={(value) =>
                      updateOverlay(overlay.id, { fontFamily: value })
                    }
                  >
                    <SelectTrigger id={`font-${overlay.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                      <SelectItem value="Courier New">Courier New</SelectItem>
                      <SelectItem value="Impact">Impact</SelectItem>
                      <SelectItem value="Comic Sans MS">Comic Sans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor={`size-${overlay.id}`}>Font Size (px)</Label>
                  <Input
                    id={`size-${overlay.id}`}
                    type="number"
                    value={overlay.fontSize}
                    onChange={(e) =>
                      updateOverlay(overlay.id, {
                        fontSize: Number(e.target.value),
                      })
                    }
                    min="12"
                    max="200"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor={`color-${overlay.id}`}>Text Color</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { label: "Primary", color: theme.colors.primary },
                        { label: "Secondary", color: theme.colors.secondary },
                        { label: "Accent", color: theme.colors.accent },
                        { label: "White", color: "#ffffff" },
                        { label: "Black", color: "#000000" },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => updateOverlay(overlay.id, { color: preset.color })}
                          className="px-2 py-1 text-xs rounded border border-border hover:bg-secondary transition-colors flex items-center gap-1.5"
                        >
                          <div
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: preset.color }}
                          />
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        id={`color-${overlay.id}`}
                        type="color"
                        value={overlay.color}
                        onChange={(e) => updateOverlay(overlay.id, { color: e.target.value })}
                        className="w-20 h-10 p-1"
                      />
                      <Input
                        value={overlay.color}
                        onChange={(e) => updateOverlay(overlay.id, { color: e.target.value })}
                        placeholder="#ffffff"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="col-span-2">
                  <Label htmlFor={`bg-${overlay.id}`}>Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`bg-${overlay.id}`}
                      type="color"
                      value={overlay.backgroundColor || "#000000"}
                      onChange={(e) =>
                        updateOverlay(overlay.id, {
                          backgroundColor: e.target.value,
                        })
                      }
                      className="w-20 h-10 p-1"
                    />
                    <Input
                      value={overlay.backgroundColor || "#000000"}
                      onChange={(e) =>
                        updateOverlay(overlay.id, {
                          backgroundColor: e.target.value,
                        })
                      }
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <Label htmlFor={`opacity-${overlay.id}`}>
                    Opacity: {Math.round(overlay.opacity * 100)}%
                  </Label>
                  <Input
                    id={`opacity-${overlay.id}`}
                    type="range"
                    value={overlay.opacity}
                    onChange={(e) =>
                      updateOverlay(overlay.id, {
                        opacity: Number(e.target.value),
                      })
                    }
                    min="0"
                    max="1"
                    step="0.1"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <Button onClick={addOverlay} variant="outline" className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              Add Text
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
