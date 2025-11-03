import { useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ArrowRight, Film } from "lucide-react";

interface VideoTitleStepProps {
  initialTitle?: string;
  initialDescription?: string;
  onNext: (title: string, description: string) => void;
}

export const VideoTitleStep = ({
  initialTitle = "",
  initialDescription = "",
  onNext,
}: VideoTitleStepProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);

  const handleNext = () => {
    if (title.trim()) {
      onNext(title, description);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card rounded-lg border border-border p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-primary/10 rounded-full mb-2">
            <Film className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Új videó projekt</h2>
          <p className="text-muted-foreground">
            Add meg a videód címét és egy rövid leírást
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Videó címe *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="pl. Nyári vakáció 2024"
              className="text-lg"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Leírás (opcionális)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Írj egy rövid leírást a videóról..."
              rows={4}
            />
          </div>
        </div>

        <Button
          onClick={handleNext}
          disabled={!title.trim()}
          size="lg"
          className="w-full gap-2"
        >
          Tovább a fájlok feltöltéséhez
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
