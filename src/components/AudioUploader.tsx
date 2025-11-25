import { useCallback, useState } from "react";
import { Upload, Music, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { BackgroundMusicLibrary } from "./BackgroundMusicLibrary";

interface AudioUploaderProps {
  audios: File[];
  onAudioAdded: (file: File) => void;
  onAudioRemoved: (index: number) => void;
}

export const AudioUploader = ({
  audios,
  onAudioAdded,
  onAudioRemoved,
}: AudioUploaderProps) => {
  const [activeTab, setActiveTab] = useState("upload");

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.type.startsWith("audio/")) {
          onAudioAdded(file);
          toast.success("Background music added");
        } else {
          toast.error("Only audio files are allowed");
        }
      }
      e.target.value = ""; // Reset input
    },
    [onAudioAdded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];

      if (file) {
        if (file.type.startsWith("audio/")) {
          onAudioAdded(file);
          toast.success("Background music added");
        } else {
          toast.error("Only audio files are allowed");
        }
      }
    },
    [onAudioAdded]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Background Music</h2>
        <p className="text-muted-foreground">
          Add, remove or browse background audio tracks
        </p>
      </div>

      {/* LIST OF ADDED AUDIOS */}
      {audios.length > 0 && (
        <div className="space-y-3">
          {audios.map((audio, index) => (
            <Card key={index} className="p-4 bg-card/60 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Music className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{audio.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(audio.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onAudioRemoved(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Your Own</TabsTrigger>
          <TabsTrigger value="library">Browse Free Music</TabsTrigger>
        </TabsList>

        {/* UPLOAD TAB */}
        <TabsContent value="upload" className="mt-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-primary/40 rounded-lg p-10 text-center 
                       hover:border-primary/70 transition-colors cursor-pointer bg-card/40 backdrop-blur"
          >
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileInput}
              className="hidden"
              id="audio-input"
            />

            <label htmlFor="audio-input" className="cursor-pointer">
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-4">
                  <div className="p-4 rounded-full bg-primary/10">
                    <Plus className="w-8 h-8 text-primary" />
                  </div>
                  <div className="p-4 rounded-full bg-primary/10">
                    <Music className="w-8 h-8 text-primary" />
                  </div>
                </div>

                <div>
                  <p className="text-lg font-semibold mb-2">
                    {audios.length === 0
                      ? "Drag audio here or click to upload"
                      : "Add more audio tracks"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supported: MP3, WAV, OGG
                  </p>
                </div>
              </div>
            </label>
          </div>
        </TabsContent>

        {/* LIBRARY TAB */}
        <TabsContent value="library" className="mt-4">
          <BackgroundMusicLibrary onTrackSelected={(track) => onAudioAdded(track)} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
