"use client";

import AcrylicBlock from "@/components/ui/AcrylicBlock";
import GlassPanel from "@/components/ui/GlassPanel";
import LedStrip from "@/components/ui/LedStrip";
import type { SubjectBreakdownData } from "./CalendarClient";

interface SubjectBreakdownProps {
  subjects: SubjectBreakdownData[];
}

export default function SubjectBreakdown({ subjects }: SubjectBreakdownProps) {
  return (
    <div className="mt-6">
      {/* Section Header */}
      <div className="flex items-center mb-3 px-1 border-b border-[#222] pb-2">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 font-mono flex items-center gap-2">
          <span className="w-2 h-2 bg-gray-600 rounded-full" />
          Module Breakdown
        </h2>
      </div>

      <GlassPanel className="p-3 space-y-2">
        {subjects.map((subject) => {
          const percentage =
            subject.scheduledDays > 0
              ? Math.round((subject.present / subject.scheduledDays) * 100)
              : 0;

          const ledTotal = Math.min(subject.scheduledDays, 10);
          const ledActive = Math.min(
            subject.present,
            ledTotal
          );

          const ledColor =
            percentage >= 75
              ? "green"
              : percentage >= 50
                ? "yellow"
                : "red";

          return (
            <AcrylicBlock
              key={subject._id}
              className="p-3"
              borderColor={subject.color}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: subject.color,
                      boxShadow: `0 0 6px ${subject.color}40`,
                    }}
                  />
                  <span className="text-sm font-mono text-gray-200 truncate max-w-[140px]">
                    {subject.name}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-gray-400">
                  {subject.present}
                  <span className="text-gray-600">/{subject.scheduledDays}</span>
                  <span className="text-gray-600 ml-1">
                    ({percentage}%)
                  </span>
                </span>
              </div>

              <LedStrip
                total={ledTotal}
                active={ledActive}
                color={ledColor as "green" | "yellow" | "red"}
              />

              {/* Status breakdown */}
              <div className="flex items-center gap-3 mt-1.5">
                {subject.present > 0 && (
                  <span className="text-[9px] font-mono text-green-500/70 uppercase tracking-wider">
                    {subject.present} present
                  </span>
                )}
                {subject.late > 0 && (
                  <span className="text-[9px] font-mono text-yellow-500/70 uppercase tracking-wider">
                    {subject.late} late
                  </span>
                )}
                {subject.absent > 0 && (
                  <span className="text-[9px] font-mono text-red-500/70 uppercase tracking-wider">
                    {subject.absent} absent
                  </span>
                )}
              </div>
            </AcrylicBlock>
          );
        })}
      </GlassPanel>
    </div>
  );
}
