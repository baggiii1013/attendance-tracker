"use client";

import AcrylicBlock from "@/components/ui/AcrylicBlock";
import ChromeToggle from "@/components/ui/ChromeToggle";
import { MaterialIcon } from "@/components/ui/Icons";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

interface SessionSlotProps {
  session: {
    sessionNumber: number;
    subject: {
      _id: string;
      name: string;
      color: string;
      startTime?: string;
      endTime?: string;
    } | null;
    attendanceMarked: boolean;
    attendanceStatus: string | null;
  };
}

export default function SessionSlotCard({ session }: SessionSlotProps) {
  const router = useRouter();
  const [isMarking, setIsMarking] = useState(false);
  const [optimisticMarked, setOptimisticMarked] = useState(
    session.attendanceMarked
  );

  const isFree = session.subject === null;
  const isMarked = optimisticMarked;

  const handleToggleAttendance = useCallback(
    async (markPresent: boolean) => {
      if (isMarking || isFree || !session.subject) return;
      setIsMarking(true);
      setOptimisticMarked(markPresent);

      try {
        if (markPresent) {
          const res = await fetch("/api/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subjectId: session.subject._id,
              status: "present",
              sessionNumber: session.sessionNumber,
            }),
          });
          if (!res.ok) {
            setOptimisticMarked(false);
          }
        } else {
          const res = await fetch(
            `/api/attendance?subjectId=${session.subject._id}&sessionNumber=${session.sessionNumber}`,
            { method: "DELETE" }
          );
          if (!res.ok) {
            setOptimisticMarked(true);
          }
        }
        router.refresh();
      } catch (error) {
        console.error("Failed to toggle attendance:", error);
        setOptimisticMarked(!markPresent);
      } finally {
        setIsMarking(false);
      }
    },
    [isMarking, isFree, session.subject, session.sessionNumber, router]
  );

  // Free session slot
  if (isFree) {
    return (
      <AcrylicBlock className="p-0 overflow-hidden opacity-50">
        <div className="px-5 py-3 flex items-center gap-4">
          {/* Session Number */}
          <div className="w-8 h-8 rounded-lg bg-[#111] border border-[#333] flex items-center justify-center shrink-0">
            <span className="text-xs font-mono font-bold text-gray-600">
              {session.sessionNumber}
            </span>
          </div>

          {/* Free Label */}
          <div className="flex-1">
            <span className="text-sm font-mono text-gray-600 uppercase tracking-wider">
              Free Period
            </span>
          </div>

          {/* Dimmed status */}
          <span className="text-[9px] font-mono text-gray-700 uppercase">
            N/A
          </span>
        </div>
      </AcrylicBlock>
    );
  }

  const subject = session.subject!;

  return (
    <AcrylicBlock
      className="p-0 overflow-hidden group"
      borderColor={isMarked ? "#22c55e" : undefined}
    >
      <div className="px-5 py-3 flex items-center gap-4">
        {/* Session Number */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
          style={{
            backgroundColor: `${subject.color}15`,
            borderColor: `${subject.color}40`,
          }}
        >
          <span
            className="text-xs font-mono font-bold"
            style={{ color: subject.color }}
          >
            {session.sessionNumber}
          </span>
        </div>

        {/* Subject Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                backgroundColor: subject.color,
                boxShadow: `0 0 6px ${subject.color}60`,
              }}
            />
            <h3 className="text-sm font-bold text-gray-200 truncate group-hover:text-white transition-colors">
              {subject.name}
            </h3>
          </div>
          {subject.startTime && subject.endTime && (
            <span className="text-[9px] font-mono text-gray-600 ml-4">
              {subject.startTime} — {subject.endTime}
            </span>
          )}
        </div>

        {/* Attendance Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          {!isMarked ? (
            <button
              onClick={() => handleToggleAttendance(true)}
              disabled={isMarking}
              className="text-[9px] font-mono text-[#4D79FF] uppercase hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              {isMarking ? "..." : "Mark"}
            </button>
          ) : (
            <button
              onClick={() => handleToggleAttendance(false)}
              disabled={isMarking}
              className="text-[9px] font-mono text-green-500 uppercase hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isMarking ? "..." : "Undo"}
            </button>
          )}
          <ChromeToggle
            checked={isMarked}
            disabled={isMarking}
            onChange={(checked) => handleToggleAttendance(checked)}
          />
        </div>
      </div>

      {/* Marked indicator bar */}
      {isMarked && (
        <div
          className="h-0.5 w-full"
          style={{
            background: `linear-gradient(90deg, ${subject.color}, transparent)`,
          }}
        />
      )}
    </AcrylicBlock>
  );
}
