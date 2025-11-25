import { useEffect, useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2 } from "lucide-react";
import { toast } from "sonner";

interface AudioPlayerProps {
  src: File | string;        // File vagy URL
  fadeIn: number;            // másodperc
  fadeOut: number;           // másodperc
  volume: number;            // 0–1
  onVolumeChange: (v: number) => void;
  onFadeInChange: (v: number) => void;
  onFadeOutChange: (v: number) => void;
}

export const AudioPlayer = ({
  src,
  fadeIn,
  fadeOut,
  volume,
  onVolumeChange,
  onFadeInChange,
  onFadeOutChange
}: AudioPlayerProps) => {

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  // ------------------------------
  // AUDIO INIT (FIX: AudioContext resume)
  // ------------------------------
  const ensureAudioContext = async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      await audioCtxRef.current.resume().catch(() => {});
    }
  };

  // ------------------------------
  // LOAD SRC (URL OR FILE)
  // ------------------------------
  useEffect(() => {
    const audio = new Audio();

    if (src instanceof File) {
      audio.src = URL.createObjectURL(src);
    } else {
      audio.src = src; // URL esetén
    }

    audio.preload = "metadata";
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0);
    };

    audio.ontimeupdate = () => {
      setPosition(audio.currentTime);
    };

    audio.onended = () => {
      setIsPlaying(false);
    };

    return () => {
      audio.pause();
    };
  }, [src]);

  // ------------------------------
  // PLAY / PAUSE
  // ------------------------------
  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    await ensureAudioContext(); // FIX: biztos user gesture után indul

    if (!sourceRef.current) {
      const ctx = audioCtxRef.current!;
      const srcNode = ctx.createMediaElementSource(audio);
      const gain = ctx.createGain();

      // Volume fix
      gain.gain.value = volume;

      srcNode.connect(gain).connect(ctx.destination);

      sourceRef.current = srcNode;
      gainRef.current = gain;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        toast.error("Audio playback blocked by browser.");
      }
    }
  };

  // ------------------------------
  // VOLUME
  // ------------------------------
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = volume;
    }
  }, [volume]);

  // ------------------------------
  // FADE IN / OUT (UI only for now)
  // ------------------------------
  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0] * duration;
    setPosition(value[0] * duration);
  };

  return (
    <div className="p-4 space-y-4 border rounded-lg bg-card/40 backdrop-blur">
      {/* PLAYBACK BAR */}
      <div className="flex items-center gap-3">
        <button
          onClick={handlePlayPause}
          className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-primary" />
          ) : (
            <Play className="w-5 h-5 text-primary" />
          )}
        </button>

        {/* SEEK / POSITION */}
        <div className="flex-1">
          <Slider
            value={[duration ? position / duration : 0]}
            max={1}
            step={0.001}
            onValueChange={handleSeek}
          />
        </div>

        <span className="text-xs text-muted-foreground w-12 text-right">
          {Math.floor(position)}/{Math.floor(duration)}s
        </span>
      </div>

      {/* VOLUME */}
      <div className="flex items-center gap-2">
        <Volume2 className="w-4 h-4 text-muted-foreground" />
        <Slider
          value={[volume]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={(v) => onVolumeChange(v[0])}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground w-8 text-right">
          {Math.round(volume * 100)}%
        </span>
      </div>

      {/* FADE BARS */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs">Fade in (sec)</label>
          <Slider
            value={[fadeIn]}
            min={0}
            max={5}
            step={0.1}
            onValueChange={(v) => onFadeInChange(v[0])}
          />
        </div>

        <div>
          <label className="text-xs">Fade out (sec)</label>
          <Slider
            value={[fadeOut]}
            min={0}
            max={5}
            step={0.1}
            onValueChange={(v) => onFadeOutChange(v[0])}
          />
        </div>
      </div>

      {/* WAVEFORM */}
      <div className="h-20 w-full bg-primary/10 rounded-md overflow-hidden">
        {/* placeholder waveform – később feltöltjük valódi analizátorral */}
        <div className="h-full flex items-end gap-[1px] p-1">
          {[...Array(120)].map((_, i) => (
            <div
              key={i}
              className="w-[2px] bg-primary/60"
              style={{
                height: `${20 + Math.sin(i / 3) * 10}px`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
