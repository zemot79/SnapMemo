import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Waveform } from "./Waveform";

interface AudioPlayerProps {
  file: File | null;
  volume: number;      // 0–100
  fadeIn: number;      // sec – egyelőre csak UI
  fadeOut: number;     // sec – egyelőre csak UI
  onVolumeChange: (v: number) => void;
  onFadeInChange: (v: number) => void;
  onFadeOutChange: (v: number) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  file,
  volume,
  fadeIn,
  fadeOut,
  onVolumeChange,
  onFadeInChange,
  onFadeOutChange,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  // blob URL a File-hoz
  useEffect(() => {
    if (!file) {
      setBlobUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setBlobUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // metaadatok, pozíció
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMeta = () => {
      setDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      setPosition(audio.currentTime || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setPosition(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMeta);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMeta);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [blobUrl]);

  // hangerő (0–100 → 0–1)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn("Playback error:", err);
        });
    }
  };

  const handleSeek = (values: number[]) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const ratio = values[0];
    const newTime = ratio * duration;
    audio.currentTime = newTime;
    setPosition(newTime);
  };

  if (!file || !blobUrl) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No audio selected.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 border rounded-lg bg-card/60 backdrop-blur">
      {/* HIDDEN AUDIO ELEM */}
      <audio ref={audioRef} src={blobUrl} preload="metadata" />

      {/* PLAYBACK SOR */}
      <div className="flex items-center gap-3">
        <button
          type="button"
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

        <span className="text-xs text-muted-foreground w-16 text-right">
          {Math.floor(position)}/{Math.floor(duration)}s
        </span>
      </div>

      {/* HANGERŐ */}
      <div className="flex items-center gap-2">
        <Volume2 className="w-4 h-4 text-muted-foreground" />
        <Slider
          value={[volume]}
          min={0}
          max={100}
          step={1}
          onValueChange={(v) => onVolumeChange(v[0])}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground w-10 text-right">
          {volume}%
        </span>
      </div>

      {/* FADE IN / OUT – most csak UI, logika később köthető rá */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs mb-1">Fade in (sec)</div>
          <Slider
            value={[fadeIn]}
            min={0}
            max={5}
            step={0.1}
            onValueChange={(v) => onFadeInChange(v[0])}
          />
          <div className="text-[11px] text-muted-foreground">
            {fadeIn.toFixed(1)}s
          </div>
        </div>
        <div>
          <div className="text-xs mb-1">Fade out (sec)</div>
          <Slider
            value={[fadeOut]}
            min={0}
            max={5}
            step={0.1}
            onValueChange={(v) => onFadeOutChange(v[0])}
          />
          <div className="text-[11px] text-muted-foreground">
            {fadeOut.toFixed(1)}s
          </div>
        </div>
      </div>

      {/* WAVEFORM – a te meglévő Waveform.tsx-edet használjuk */}
      <Waveform audioRef={audioRef} />
    </div>
  );
};
