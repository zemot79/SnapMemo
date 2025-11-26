import React from "react";

export const Waveform: React.FC = () => {
  return (
    <div className="h-20 w-full bg-primary/10 rounded-md overflow-hidden flex items-end gap-[1px] p-1">
      {Array.from({ length: 120 }).map((_, i) => (
        <div
          key={i}
          className="w-[2px] bg-primary/60"
          style={{
            height: `${20 + Math.sin(i / 3) * 10}px`,
          }}
        />
      ))}
    </div>
  );
};
