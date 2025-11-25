import { useEffect, useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2 } from "lucide-react";
import { toast } from "sonner";

interface AudioPlayerProps {
  src: File | string;
  fadeIn: number;
  fadeOut: number;
  volume: number;
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
  onFadeOutChange,
}: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  // -------------------------------------------------------
  // 1) A stabil AudioContext egyszer jön létre
  // -------------------------------------------------------
  const initAudioContext = async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      await audioCtxRef.current.resume().catch(() => {});
    }
  };

  // -------------------------------------------------------
  // 2) Az audio element stabil (NEM jön létre új minden rendernél)
  // -------------------------------------------------------
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;

    // File vagy URL?
    if (src instanceof File) {
      const url = URL.createObjectURL(src);
      audio.src = url;
    } else {
      audio.src = src;
    }

    audio.preload = "metadata";

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

  // -------------------------------------------------------
  // 3) Play / Pause — stabil
  // -------------------------------------------------------
  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    await initAudioContext();

    // Létrehozzuk EGYSZER a sourceNode + gainNode-ot
    if (!sourceRef.current) {
      const ctx = audioCtxRef.current!;
      const srcNode = ctx.createMediaElementSource(audio);
      const gainNode = ctx.createGain();

      srcNode.connect(gainNode).connect(ctx.destination);
      gainNode.gain.value = volume;

      sourceRef.current = srcNode;
      gainRef.current = gainNode;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (e) {
        toast.error("Autoplay blocked — click again to start.");
      }
    }
  };

  // -------------------------------------------------------
  // 4) Volume (gain node)
  // -------------------------------------------------------
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = volume;
    }
  }, [volume]);

  // -------------------------------------------------------
  // 5) Fade-in / Fade-out (gain automations)
  // -------------------------------------------------------
  useEffect(() => {
    const audio = audioRef.current;
    const gain = gainRef.current;
    const ctx = audioCtxRef.current;

    if (!audio || !gain || !ctx) return;

    gain.gain.cancelScheduledValues(ctx.currentTime);

    // fade in
    gain.gain.setValueAtTime(0, audio.currentTime);
    gain.gain.linearRampToValueAtTime(volume, audio.currentTime + fadeIn);

    // fade out
    if (fadeOut > 0 && duration > 0) {
      const startFadeOutAt = duration - fadeOut;
      if (startFadeOutAt > 0) {
        gain.gain.setValueAtTime(volume, startFadeOutAt);
        gain.gain.linearRampToValueAtTime(0, duration);
      }
    }
  }, [fadeIn, fadeOut, duration, volume]);

  // -------------------------------------------------------
  // 6) Seeking
  // -------------------------------------------------------
  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = value[0] * duration;
    audio.currentTime = newTime;
    setPosition(newTime);
  };

  return (
    <div className="p-4 space-y-4 border rounded-lg bg-card/40 backdrop-blur">
      {/* PLAYBACK LINE */}
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

        <div className="flex-1">
          <Slider
            value={[duration ? position / duration : 0]}
            max={1}
            step={0.001}
            onValueChange={handleSeek}
          />
        </div>

        <span className="text-xs text-muted-foreground w-12 text-right">
          {Math.floor(position)} / {Math.floor(duration)}s
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
        <span className="text-xs w-10 text-right text-muted-foreground">
          {Math.round(volume * 100)}%
        </span>
      </div>

      {/* FADE */}
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
    </div>
  );
};
