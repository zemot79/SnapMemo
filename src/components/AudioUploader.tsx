import { useState, useRef } from "react";
import { Upload, Music, X } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "./ui/use-toast";

interface AudioUploaderProps {
  audio: File | null;
  onAudioAdded: (file: File) => void;
  onAudioRemoved: () => void;
}

export const AudioUploader = ({
  audio,
  onAudioAdded,
  onAudioRemoved,
}: AudioUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const audioFile = files.find((file) => file.type.startsWith("audio/"));

    if (audioFile) {
      onAudioAdded(audioFile);
      toast({
        title: "Zene feltöltve",
        description: audioFile.name,
      });
    } else {
      toast({
        title: "Hiba",
        description: "Kérlek csak audio fájlt tölts fel",
        variant: "destructive",
      });
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      onAudioAdded(files[0]);
      toast({
        title: "Zene feltöltve",
        description: files[0].name,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2 mb-6">
        <div className="inline-flex p-3 bg-primary/10 rounded-full">
          <Music className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Zene aláfestés</h2>
        <p className="text-muted-foreground">
          Adj hozzá háttérzenét a videódhoz (opcionális)
        </p>
      </div>

      {!audio ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg mb-2">Húzd ide az audio fájlt</p>
          <p className="text-sm text-muted-foreground mb-4">
            vagy kattints a tallózáshoz
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Fájl kiválasztása
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 p-4 bg-primary/10 rounded-lg">
              <Music className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{audio.name}</p>
              <p className="text-sm text-muted-foreground">
                {(audio.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onAudioRemoved}
              className="flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <audio controls className="w-full mt-4">
            <source src={URL.createObjectURL(audio)} type={audio.type} />
          </audio>
        </div>
      )}
    </div>
  );
};
