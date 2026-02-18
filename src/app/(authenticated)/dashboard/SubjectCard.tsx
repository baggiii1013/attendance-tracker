"use client";

import AcrylicBlock from "@/components/ui/AcrylicBlock";
import ChromeToggle from "@/components/ui/ChromeToggle";
import LedStrip from "@/components/ui/LedStrip";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

interface ScheduleSlot {
  day: string;
  startTime: string;
  endTime: string;
}

interface SubjectProps {
  subject: {
    _id: string;
    name: string;
    slots: ScheduleSlot[];
    displayTime: string;
    color: string;
    isScheduledToday: boolean;
    sessionStatus: "active" | "upcoming" | "completed" | "inactive";
    attendanceMarked: boolean;
    attendanceStatus: string | null;
  };
}

export default function SubjectCard({ subject }: SubjectProps) {
  const router = useRouter();
  const [isMarking, setIsMarking] = useState(false);
  const [optimisticMarked, setOptimisticMarked] = useState(subject.attendanceMarked);

  const statusConfig = {
    active: {
      dotColor: "bg-green-500 shadow-led-green",
      label: "LIVE SESSION",
      labelColor: "text-green-400",
      borderColor: "#22c55e",
    },
    upcoming: {
      dotColor: "bg-yellow-500 shadow-led-red",
      label: `${subject.displayTime.split(" — ")[0]} - PENDING`,
      labelColor: "text-gray-400",
      borderColor: undefined,
    },
    completed: {
      dotColor: "bg-gray-600",
      label: `${subject.displayTime.split(" — ")[1] || ""} - DONE`,
      labelColor: "text-gray-500",
      borderColor: undefined,
    },
    inactive: {
      dotColor: "bg-gray-600",
      label: "NOT TODAY",
      labelColor: "text-gray-500",
      borderColor: undefined,
    },
  };

  const config = statusConfig[subject.sessionStatus];

  const handleToggleAttendance = useCallback(
    async (markPresent: boolean) => {
      if (isMarking) return;
      setIsMarking(true);
      setOptimisticMarked(markPresent);

      try {
        if (markPresent) {
          // Mark as present
          const res = await fetch("/api/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subjectId: subject._id,
              status: "present",
            }),
          });
          if (!res.ok) {
            setOptimisticMarked(false); // revert on failure
          }
        } else {
          // Un-mark attendance
          const res = await fetch(
            `/api/attendance?subjectId=${subject._id}`,
            { method: "DELETE" }
          );
          if (!res.ok) {
            setOptimisticMarked(true); // revert on failure
          }
        }
        router.refresh();
      } catch (error) {
        console.error("Failed to toggle attendance:", error);
        setOptimisticMarked(!markPresent); // revert on error
      } finally {
        setIsMarking(false);
      }
    },
    [isMarking, subject._id, router]
  );

  // Use optimistic state for display
  const isMarked = optimisticMarked;

  const stabilityPercent = isMarked
    ? 95
    : subject.sessionStatus === "active"
      ? 85
      : 70;
  const ledCount = Math.round((stabilityPercent / 100) * 10);
  const ledColor =
    stabilityPercent >= 80
      ? "green"
      : stabilityPercent >= 50
        ? "yellow"
        : "red";

  return (
    <AcrylicBlock
      className="p-0 overflow-hidden group"
      borderColor={config.borderColor}
    >
      {/* Status Bar */}
      <div className="bg-[#151518] px-5 py-3 border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div
            className={`w-1.5 h-1.5 rounded-full ${config.dotColor} ${subject.sessionStatus === "active" ? "animate-pulse" : ""}`}
          />
          <span
            className={`text-[10px] font-mono tracking-wider ${config.labelColor}`}
          >
            {config.label}
          </span>
        </div>
        <span className="text-[10px] font-mono text-gray-600">
          {subject.displayTime}
        </span>
      </div>

      {/* Content */}
      <div className="p-5 flex justify-between items-center relative z-10">
        <div className="flex-1 pr-4">
          <h3 className="text-xl font-bold text-gray-200 mb-4 group-hover:text-white transition-colors">
            {subject.name}
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-mono text-gray-500 uppercase">
              <span>Stability</span>
              <span
                className={
                  stabilityPercent >= 80
                    ? "text-green-400"
                    : stabilityPercent >= 50
                      ? "text-yellow-400"
                      : "text-red-400"
                }
              >
                {stabilityPercent}%
              </span>
            </div>
            <LedStrip
              total={10}
              active={ledCount}
              color={ledColor}
              className="h-3 gap-1"
            />
          </div>
        </div>

        {/* Toggle / Action */}
        <div className="flex flex-col items-center gap-2 border-l border-white/5 pl-4">
          {subject.isScheduledToday && !isMarked ? (
            <button
              onClick={() => handleToggleAttendance(true)}
              disabled={isMarking}
              className="text-[9px] font-mono text-[#4D79FF] uppercase hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              {isMarking ? "..." : "Mark"}
            </button>
          ) : isMarked ? (
            <button
              onClick={() => handleToggleAttendance(false)}
              disabled={isMarking}
              className="text-[9px] font-mono text-green-500 uppercase hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isMarking ? "..." : "Undo"}
            </button>
          ) : (
            <span className="text-[9px] font-mono text-gray-600 uppercase">
              Wait
            </span>
          )}
          <ChromeToggle
            checked={isMarked}
            disabled={!subject.isScheduledToday || isMarking}
            onChange={(checked) => handleToggleAttendance(checked)}
          />
        </div>
      </div>
    </AcrylicBlock>
  );
}
