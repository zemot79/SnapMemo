import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, Music, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import { BackgroundMusicLibrary } from "./BackgroundMusicLibrary";
import { Waveform } from "./Waveform";

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
  const [volume, setVolume] = useState<number>(1);
  const [fadeIn, setFadeIn] = useState<number>(0);
  const [fadeOut, setFadeOut] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  // fő track: az első audio
  useEffect(() => {
    if (audios.length === 0) {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      setObjectUrl(null);
      return;
    }

    const url = URL.createObjectURL(audios[0]);
    setObjectUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audios]);

  // hangerő slider → audio elemre
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // fade-out logika
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onTimeUpdate = () => {
      if (!fadeOut || !volume) return;
      const dur = el.duration;
      if (!dur || !Number.isFinite(dur)) return;

      const t = el.currentTime;
      const startFade = dur - fadeOut;

      if (t >= startFade && t <= dur) {
        const remaining = dur - t;
        const factor = Math.max(remaining / fadeOut, 0);
        el.volume = volume * factor;
      } else if (t < startFade) {
        // még nem vagyunk fade-out szakaszban → állítsuk vissza
        el.volume = volume;
      }
    };

    el.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      el.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [fadeOut, volume]);

  const handlePlay = () => {
    const el = audioRef.current;
    if (!el) return;

    if (fadeIn > 0) {
      const target = volume;
      el.volume = 0;

      const start = performance.now();
      const durationMs = fadeIn * 1000;

      const step = (now: number) => {
        const progress = Math.min((now - start) / durationMs, 1);
        el.volume = target * progress;
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };

      requestAnimationFrame(step);
    } else {
      el.volume = volume;
    }
  };

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
      e.target.value = ""; // reset input
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
          Add, remove and fine-tune background audio
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

      {/* TABS: UPLOAD / LIBRARY */}
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
                    Supported formats: MP3, WAV, OGG
                  </p>
                </div>
              </div>
            </label>
          </div>
        </TabsContent>

        {/* LIBRARY TAB */}
        <TabsContent value="library" className="mt-4">
          <BackgroundMusicLibrary onTrackSelected={onAudioAdded} />
        </TabsContent>
      </Tabs>

      {/* PLAYBACK + CONTROLS + WAVEFORM */}
      {objectUrl && (
        <Card className="p-4 space-y-4 bg-card/70">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Playback & Mix</span>
          </div>

          <audio
            ref={audioRef}
            src={objectUrl}
            controls
            onPlay={handlePlay}
            className="w-full"
          />

          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Volume</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[volume * 100]}
                  min={0}
                  max={150}
                  step={1}
                  onValueChange={(v) => setVolume((v[0] ?? 100) / 100)}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {(volume * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Fade in (sec)</Label>
                <Slider
                  value={[fadeIn]}
                  min={0}
                  max={5}
                  step={0.5}
                  onValueChange={(v) => setFadeIn(v[0] ?? 0)}
                />
                <div className="text-[11px] text-muted-foreground">
                  {fadeIn.toFixed(1)}s
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Fade out (sec)</Label>
                <Slider
                  value={[fadeOut]}
                  min={0}
                  max={5}
                  step={0.5}
                  onValueChange={(v) => setFadeOut(v[0] ?? 0)}
                />
                <div className="text-[11px] text-muted-foreground">
                  {fadeOut.toFixed(1)}s
                </div>
              </div>
            </div>
          </div>

          <Waveform audioRef={audioRef} />
        </Card>
      )}
    </div>
  );
};
