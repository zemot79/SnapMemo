import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Blend,
  Sparkles,
  Zap,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

export interface TransitionOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface TransitionsEditorProps {
  /**
   * Ha majd a timeline-hoz kötjük, ezen keresztül visszaküldjük
   * a kiválasztott transition ID-ket.
   */
  onChange?: (selected: string[]) => void;

  /**
   * Opcionális alapértelmezett kiválasztások.
   */
  defaultSelected?: string[];
}

const ALL_TRANSITIONS: TransitionOption[] = [
  {
    id: "fade",
    label: "Fade",
    description: "Classic soft fade-in/out",
    icon: <Blend className="w-4 h-4 text-primary" />,
  },
  {
    id: "cross-dissolve",
    label: "Cross Dissolve",
    description: "Smooth blend between clips",
    icon: <Blend className="w-4 h-4 text-purple-500" />,
  },
  {
    id: "film-burn",
    label: "Film Burn",
    description: "Stylized analog burn effect",
    icon: <Sparkles className="w-4 h-4 text-orange-400" />,
  },
  {
    id: "whip-pan",
    label: "Whip Pan",
    description: "Fast horizontal motion blur cut",
    icon: <ArrowUpRight className="w-4 h-4 text-blue-400" />,
  },
  {
    id: "zoom-warp",
    label: "Zoom Warp",
    description: "Energetic digital zoom transition",
    icon: <Zap className="w-4 h-4 text-yellow-400" />,
  },
  {
    id: "slide",
    label: "Slide",
    description: "Soft sliding movement from left/right",
    icon: <ArrowDownLeft className="w-4 h-4 text-green-400" />,
  },
];

export const TransitionsEditor = ({
  onChange,
  defaultSelected = [],
}: TransitionsEditorProps) => {
  const [selected, setSelected] = useState<string[]>(defaultSelected);

  const toggle = (id: string) => {
    let updated: string[];

    if (selected.includes(id)) {
      updated = selected.filter((t) => t !== id);
    } else {
      updated = [...selected, id];
    }

    setSelected(updated);
    onChange?.(updated);
  };

  const clearAll = () => {
    setSelected([]);
    onChange?.([]);
  };

  const selectAll = () => {
    const all = ALL_TRANSITIONS.map((t) => t.id);
    setSelected(all);
    onChange?.(all);
  };

  return (
    <Card className="p-4 space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Transitions</h3>
          <p className="text-xs text-muted-foreground">
            Select multiple transitions – SnapMemo will randomize them between clips.
          </p>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={selectAll}>
          Select all
        </Button>
        <Button variant="outline" size="sm" onClick={clearAll}>
          Clear
        </Button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ALL_TRANSITIONS.map((t) => (
          <label
            key={t.id}
            className="flex items-start gap-3 border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition select-none"
            onClick={() => toggle(t.id)}
          >
            <Checkbox
              checked={selected.includes(t.id)}
              onCheckedChange={() => toggle(t.id)}
            />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                {t.icon}
                <span className="font-medium text-sm">{t.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </div>
          </label>
        ))}
      </div>
    </Card>
  );
};

