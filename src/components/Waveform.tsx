import React, { useEffect, useRef } from "react";

interface WaveformProps {
  audioRef: React.RefObject<HTMLAudioElement>;
}

export const Waveform: React.FC<WaveformProps> = ({ audioRef }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const audioEl = audioRef.current;
    const canvas = canvasRef.current;
    if (!audioEl || !canvas) return;

    const AudioCtx =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const audioCtx = new AudioCtx();
    const source = audioCtx.createMediaElementSource(audioEl);
    const analyser = audioCtx.createAnalyser();

    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);
    // nem kötjük a destination-re, az audio elem magától szól

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      audioCtx.close();
      return;
    }

    let animationId: number;

    const renderFrame = () => {
      analyser.getByteFrequencyData(dataArray);

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i];
        const barHeight = (value / 255) * height;

        const y = height - barHeight;

        ctx.fillStyle = "rgba(59,130,246,0.8)"; // tailwind primary approx
        ctx.fillRect(x, y, barWidth, barHeight);

        x += barWidth + 1;
      }

      animationId = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      cancelAnimationFrame(animationId);
      analyser.disconnect();
      source.disconnect();
      audioCtx.close();
    };
  }, [audioRef]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-20 rounded-md bg-muted"
      width={600}
      height={80}
    />
  );
};
