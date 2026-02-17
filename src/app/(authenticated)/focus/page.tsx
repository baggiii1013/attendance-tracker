"use client";

import CircularProgress from "@/components/ui/CircularProgress";
import ClayButton from "@/components/ui/ClayButton";
import { GlassIconButton, MaterialIcon } from "@/components/ui/Icons";
import MetalButton from "@/components/ui/MetalButton";
import { useCallback, useEffect, useRef, useState } from "react";

const BREAK_DURATION = 5 * 60; // 5 minutes in seconds

const DURATION_PRESETS = [
  { label: "15m", minutes: 15 },
  { label: "25m", minutes: 25 },
  { label: "45m", minutes: 45 },
  { label: "60m", minutes: 60 },
  { label: "90m", minutes: 90 },
];

type TimerState = "idle" | "running" | "paused" | "break";

interface FocusSessionRecord {
  _id: string;
  duration: number;
  completed: boolean;
  completedAt: string;
  xpEarned: number;
}

interface SessionStats {
  totalSessions: number;
  totalMinutes: number;
  totalXP: number;
}

export default function FocusPage() {
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const focusDuration = selectedMinutes * 60;

  const [timeLeft, setTimeLeft] = useState(focusDuration);
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [todaySessions, setTodaySessions] = useState<FocusSessionRecord[]>([]);
  const [stats, setStats] = useState<SessionStats>({
    totalSessions: 0,
    totalMinutes: 0,
    totalXP: 0,
  });
  const [customMinutes, setCustomMinutes] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentDuration =
    timerState === "break" ? BREAK_DURATION : focusDuration;
  const progress =
    ((currentDuration - timeLeft) / currentDuration) * 100;

  // Fetch today's session history
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/focus?period=today&limit=50");
      if (res.ok) {
        const data = await res.json();
        setTodaySessions(data.sessions || []);
        setStats(data.stats || { totalSessions: 0, totalMinutes: 0, totalXP: 0 });
      }
    } catch (err) {
      console.error("Failed to fetch focus sessions:", err);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0)
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatTotalTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const handleComplete = useCallback(async () => {
    try {
      await fetch("/api/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration: selectedMinutes,
          completed: true,
        }),
      });
      // Refresh session list
      fetchSessions();
    } catch (err) {
      console.error("Failed to log focus session:", err);
    }

    setSessionsCompleted((prev) => prev + 1);
    setTotalFocusTime((prev) => prev + focusDuration);

    // Start break
    setTimeLeft(BREAK_DURATION);
    setTimerState("break");
  }, [selectedMinutes, focusDuration, fetchSessions]);

  useEffect(() => {
    if (timerState === "running" || timerState === "break") {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            if (timerState === "running") {
              handleComplete();
            } else {
              setTimerState("idle");
              return focusDuration;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerState, handleComplete, focusDuration]);

  const handleStart = () => {
    if (timerState === "idle" || timerState === "paused") {
      setTimerState("running");
    }
  };

  const handlePause = () => {
    if (timerState === "running") {
      setTimerState("paused");
    }
  };

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerState("idle");
    setTimeLeft(focusDuration);
  };

  const handleDurationChange = (minutes: number) => {
    if (timerState !== "idle") return; // Don't change while running
    setSelectedMinutes(minutes);
    setTimeLeft(minutes * 60);
    setShowCustomInput(false);
  };

  const handleCustomSubmit = () => {
    const mins = parseInt(customMinutes, 10);
    if (!isNaN(mins) && mins > 0 && mins <= 180) {
      handleDurationChange(mins);
      setCustomMinutes("");
    }
  };

  const label =
    timerState === "break"
      ? "Break Time"
      : timerState === "running"
        ? "Deep Work"
        : timerState === "paused"
          ? "Paused"
          : "Ready";

  const isIdle = timerState === "idle";

  return (
    <div className="relative flex flex-col h-screen w-full max-w-md md:max-w-2xl lg:max-w-4xl mx-auto bg-void-gradient overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6 z-10">
        <GlassIconButton icon="arrow_back" href="/dashboard" ariaLabel="Back" />
        <h1 className="text-sm font-bold tracking-[0.2em] uppercase text-white/50">
          Focus Session
        </h1>
        <div className="w-10" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar relative z-0">
        {/* Timer + Duration Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center lg:gap-12 flex-shrink-0">
          {/* Timer Container */}
          <div className="flex flex-col items-center justify-center py-4 md:py-8">
            {/* Floating glows */}
            <div className="absolute top-10 left-10 w-32 h-32 bg-[#805af2]/20 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

            <CircularProgress
              size={288}
              strokeWidth={6}
              progress={progress}
              timeDisplay={formatTime(timeLeft)}
              label={label}
            />

            {/* Stats under timer */}
            <div className="mt-6 md:mt-8 flex gap-8">
              <div className="flex flex-col items-center">
                <span className="text-xs font-mono text-white/30 uppercase mb-1">
                  Session
                </span>
                <span className="text-lg font-bold text-white">
                  {sessionsCompleted +
                    (timerState === "running" || timerState === "paused"
                      ? 1
                      : 0)}
                  /{sessionsCompleted + 1}
                </span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex flex-col items-center">
                <span className="text-xs font-mono text-white/30 uppercase mb-1">
                  Total
                </span>
                <span className="text-lg font-bold text-white">
                  {formatTotalTime(
                    totalFocusTime +
                      (timerState === "running"
                        ? focusDuration - timeLeft
                        : 0)
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Duration Selector — only when idle */}
          {isIdle && (
            <div className="px-6 py-4 md:py-6 flex-shrink-0">
              <label className="block text-xs font-mono text-white/30 uppercase tracking-widest mb-3 text-center lg:text-left">
                Duration
              </label>
              <div className="flex flex-wrap justify-center lg:justify-start gap-2 md:gap-3">
                {DURATION_PRESETS.map((preset) => (
                  <button
                    key={preset.minutes}
                    onClick={() => handleDurationChange(preset.minutes)}
                    className={`px-4 py-2.5 md:px-5 md:py-3 rounded-xl font-mono text-sm md:text-base font-bold transition-all active:scale-95 cursor-pointer ${
                      selectedMinutes === preset.minutes && !showCustomInput
                        ? "bg-[#805af2] text-white shadow-[inset_2px_2px_4px_rgba(255,255,255,0.3),0_4px_12px_rgba(128,90,242,0.4)]"
                        : "bg-[#1a1a1f] text-gray-400 border border-white/10 shadow-plump hover:text-white hover:border-white/20"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  onClick={() => setShowCustomInput(!showCustomInput)}
                  aria-label="Custom duration"
                  className={`px-4 py-2.5 md:px-5 md:py-3 rounded-xl font-mono text-sm md:text-base font-bold transition-all active:scale-95 cursor-pointer ${
                    showCustomInput
                      ? "bg-[#805af2] text-white shadow-[inset_2px_2px_4px_rgba(255,255,255,0.3),0_4px_12px_rgba(128,90,242,0.4)]"
                      : "bg-[#1a1a1f] text-gray-400 border border-white/10 shadow-plump hover:text-white hover:border-white/20"
                  }`}
                >
                  <MaterialIcon name="tune" size={18} />
                </button>
              </div>

              {/* Custom input */}
              {showCustomInput && (
                <div className="mt-3 flex items-center gap-2 justify-center lg:justify-start">
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
                    placeholder="Min (1-180)"
                    className="w-32 bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] rounded-xl px-4 py-2.5 text-white font-mono text-sm text-center placeholder-gray-600 focus:border-[#805af2]/50 focus:ring-0 outline-none"
                  />
                  <button
                    onClick={handleCustomSubmit}
                    aria-label="Confirm custom duration"
                    className="p-2.5 rounded-xl bg-[#805af2] text-white active:scale-95 transition-transform cursor-pointer"
                  >
                    <MaterialIcon name="check" size={18} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Today's Sessions Record */}
        <div className="px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-mono text-white/30 uppercase tracking-widest">
              Today&apos;s Sessions
            </label>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-[#805af2] bg-[#805af2]/10 px-2 py-0.5 rounded border border-[#805af2]/30">
                {stats.totalSessions} done
              </span>
              <span className="text-[10px] font-mono text-[#4D79FF] bg-[#4D79FF]/10 px-2 py-0.5 rounded border border-[#4D79FF]/30">
                {stats.totalMinutes}m total
              </span>
              <span className="text-[10px] font-mono text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded border border-[#22c55e]/30">
                +{stats.totalXP} XP
              </span>
            </div>
          </div>

          {todaySessions.length === 0 ? (
            <div className="bg-[rgba(255,255,255,0.03)] border border-white/5 rounded-2xl p-6 md:p-8 text-center">
              <MaterialIcon
                name="self_improvement"
                size={32}
                className="text-white/10 mx-auto mb-2"
              />
              <p className="text-sm text-gray-600 font-mono">
                No sessions yet today. Start focusing!
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 md:max-h-64 overflow-y-auto no-scrollbar">
              {todaySessions.map((s) => (
                <div
                  key={s._id}
                  className="flex items-center justify-between bg-[rgba(255,255,255,0.03)] border border-white/5 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        s.completed
                          ? "bg-[#22c55e] shadow-[0_0_6px_rgba(34,197,94,0.8)]"
                          : "bg-[#FF4D4D] shadow-[0_0_6px_rgba(255,77,77,0.6)]"
                      }`}
                    />
                    <span className="text-sm font-mono text-white/70">
                      {s.duration}m focus
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {s.xpEarned > 0 && (
                      <span className="text-xs font-mono text-[#22c55e]">
                        +{s.xpEarned} XP
                      </span>
                    )}
                    <span className="text-xs font-mono text-white/30">
                      {new Date(s.completedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Spacer for controls + bottom nav */}
        <div className="h-52 md:h-56 flex-shrink-0" />
      </main>

      {/* Control Plinth */}
      <div className="absolute bottom-20 md:bottom-24 left-0 right-0 z-20 px-4 md:px-6">
        <div className="bg-[#181620] border-t border-white/10 rounded-t-[2rem] md:rounded-t-[3rem] p-6 md:p-8 pb-6 md:pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] relative max-w-md md:max-w-2xl lg:max-w-4xl mx-auto">
          {/* Decorative screws */}
          <div className="absolute top-4 md:top-6 left-4 md:left-6 w-3 h-3 rounded-full bg-[#2a2835] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8),1px_1px_0_rgba(255,255,255,0.1)] flex items-center justify-center">
            <div className="w-1.5 h-0.5 bg-[#15131a] transform rotate-45" />
          </div>
          <div className="absolute top-4 md:top-6 right-4 md:right-6 w-3 h-3 rounded-full bg-[#2a2835] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8),1px_1px_0_rgba(255,255,255,0.1)] flex items-center justify-center">
            <div className="w-1.5 h-0.5 bg-[#15131a] transform rotate-45" />
          </div>

          <div className="flex items-center justify-center gap-4 md:gap-6 mt-1 md:mt-2">
            {/* Reset Button */}
            <MetalButton
              onClick={handleReset}
              aria-label="Reset Timer"
              className="w-14 h-14 md:w-16 md:h-16 group"
            >
              <MaterialIcon
                name="replay"
                size={28}
                className="text-white/40 group-hover:text-white/80 transition-colors"
              />
            </MetalButton>

            {/* Start/Pause Button */}
            <ClayButton
              onClick={timerState === "running" ? handlePause : handleStart}
              className="h-16 md:h-20 flex-1 rounded-2xl text-lg md:text-xl"
              variant={timerState === "break" ? "coral" : "primary"}
            >
              {timerState === "running"
                ? "Pause"
                : timerState === "break"
                  ? "On Break"
                  : timerState === "paused"
                    ? "Resume"
                    : "Start Focus"}
            </ClayButton>
          </div>
        </div>
      </div>

      {/* Spacer for bottom nav */}
      <div className="h-20" />
    </div>
  );
}
