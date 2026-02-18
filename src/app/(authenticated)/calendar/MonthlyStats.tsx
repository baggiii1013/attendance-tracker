"use client";

import AcrylicBlock from "@/components/ui/AcrylicBlock";
import { MaterialIcon } from "@/components/ui/Icons";
import type { MonthlyStatsData } from "./CalendarClient";

interface MonthlyStatsProps {
  data: MonthlyStatsData;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export default function MonthlyStats({ data }: MonthlyStatsProps) {
  return (
    <div className="flex gap-3 mb-6 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
      {/* Attendance Rate */}
      <AcrylicBlock className="p-3 flex flex-col items-center min-w-[80px] shrink-0">
        <div className="relative w-12 h-12 mb-1.5">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="transparent"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="3"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="transparent"
              stroke="#805af2"
              strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={`${2 * Math.PI * 20 * (1 - data.attendanceRate / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-500"
              style={{
                filter: "drop-shadow(0 0 4px rgba(128, 90, 242, 0.6))",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] font-mono font-bold text-white">
              {data.attendanceRate}
              <span className="text-[8px] text-gray-500">%</span>
            </span>
          </div>
        </div>
        <span className="text-[8px] font-mono uppercase tracking-widest text-gray-500">
          Attend
        </span>
      </AcrylicBlock>

      {/* Streak */}
      <AcrylicBlock className="p-3 flex flex-col items-center justify-between min-w-[80px] shrink-0">
        <MaterialIcon
          name="local_fire_department"
          filled
          size={18}
          className="text-orange-600 drop-shadow-[0_0_5px_rgba(234,88,12,0.4)] mb-1"
        />
        <span className="text-lg font-mono font-bold text-white leading-none">
          {data.currentStreak}
        </span>
        <span className="text-[8px] font-mono text-gray-600 mt-0.5">
          BEST: {data.longestStreak}
        </span>
        <span className="text-[8px] font-mono uppercase tracking-widest text-gray-500 mt-1">
          Streak
        </span>
      </AcrylicBlock>

      {/* Focus Time */}
      <AcrylicBlock className="p-3 flex flex-col items-center justify-between min-w-[80px] shrink-0">
        <MaterialIcon
          name="timer"
          size={18}
          className="text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.4)] mb-1"
        />
        <span className="text-lg font-mono font-bold text-white leading-none">
          {formatMinutes(data.totalFocusMinutes)}
        </span>
        <span className="text-[8px] font-mono uppercase tracking-widest text-gray-500 mt-1">
          Focus
        </span>
      </AcrylicBlock>

      {/* XP Earned */}
      <AcrylicBlock className="p-3 flex flex-col items-center justify-between min-w-[80px] shrink-0">
        <MaterialIcon
          name="bolt"
          filled
          size={18}
          className="text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.4)] mb-1"
        />
        <span className="text-lg font-mono font-bold text-white leading-none">
          {data.xpEarned}
        </span>
        <span className="text-[8px] font-mono uppercase tracking-widest text-gray-500 mt-1">
          XP
        </span>
      </AcrylicBlock>
    </div>
  );
}
