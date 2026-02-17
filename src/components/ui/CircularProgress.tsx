"use client";

interface CircularProgressProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0-100
  timeDisplay: string;
  label?: string;
  className?: string;
}

export default function CircularProgress({
  size = 288,
  strokeWidth = 6,
  progress,
  timeDisplay,
  label = "Deep Work",
  className = "",
}: CircularProgressProps) {
  const center = size / 2;
  const radius = center - strokeWidth - 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Calculate traveler dot position
  const angle = (progress / 100) * 2 * Math.PI - Math.PI / 2;
  const dotX = center + radius * Math.cos(angle);
  const dotY = center + radius * Math.sin(angle);

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Glass Ring Track */}
      <div className="absolute inset-0 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-sm shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]" />

      {/* SVG Progress Ring */}
      <svg
        className="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(128,90,242,0.5)]"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Track */}
        <circle
          className="text-white/5"
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth - 2}
        />
        {/* Progress */}
        <circle
          className="text-[#805af2] transition-all duration-100 ease-linear"
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>

      {/* Chrome Traveler Dot */}
      {progress > 0 && (
        <div
          className="absolute w-6 h-6 rounded-full bg-chrome-gradient shadow-[0_0_15px_rgba(255,255,255,0.6),inset_0_-2px_4px_rgba(0,0,0,0.5)] z-20 transition-all duration-100"
          style={{
            left: dotX - 12,
            top: dotY - 12,
          }}
        >
          <div className="absolute inset-0 bg-white/40 blur-[2px] rounded-full" />
        </div>
      )}

      {/* Digital Readout */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="font-mono text-6xl font-bold tracking-tighter text-white neon-text-glow drop-shadow-2xl">
          {timeDisplay}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#805af2] animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-widest text-white/40">
            {label}
          </span>
        </div>
      </div>

      {/* Inner Glass Decoration */}
      <div className="absolute inset-4 rounded-full border border-white/5 pointer-events-none" />
    </div>
  );
}
