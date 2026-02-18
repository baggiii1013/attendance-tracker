"use client";

import AcrylicBlock from "@/components/ui/AcrylicBlock";
import GlassPanel from "@/components/ui/GlassPanel";
import { MaterialIcon } from "@/components/ui/Icons";
import { format } from "date-fns";
import { motion } from "framer-motion";
import type { AttendanceRecord, DayData } from "./CalendarClient";

interface DayDetailSheetProps {
  date: Date;
  records: AttendanceRecord[];
  dayData: DayData | null;
  onClose: () => void;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; icon: string; label: string }> = {
    present: { color: "text-green-500", icon: "check_circle", label: "PRESENT" },
    absent: { color: "text-red-500", icon: "cancel", label: "ABSENT" },
    late: { color: "text-yellow-500", icon: "schedule", label: "LATE" },
  };

  const { color, icon, label } = config[status] || config.absent;

  return (
    <div className={`flex items-center gap-1 ${color}`}>
      <MaterialIcon name={icon} filled size={14} />
      <span className="text-[9px] font-mono uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default function DayDetailSheet({
  date,
  records,
  dayData,
  onClose,
}: DayDetailSheetProps) {
  const formattedDate = format(date, "EEEE, MMM d");
  const hasData = records.length > 0 || (dayData && (dayData.focusMinutes > 0 || dayData.xp > 0));

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/60 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] flex flex-col"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100 || info.velocity.y > 500) {
            onClose();
          }
        }}
      >
        <div className="acrylic-block rounded-t-2xl overflow-hidden">
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-600" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-3 border-b border-[#222]">
            <div>
              <h2 className="text-[10px] font-mono etched-text uppercase tracking-[0.2em] mb-0.5">
                DAY_LOG
              </h2>
              <span className="text-base font-mono font-bold text-gray-200">
                {formattedDate.toUpperCase()}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full glass-panel text-gray-500 hover:text-white transition-colors"
            >
              <MaterialIcon name="close" size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[55vh] px-5 py-4 space-y-3 no-scrollbar">
            {!hasData ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <MaterialIcon
                  name="event_busy"
                  size={40}
                  className="text-gray-700"
                />
                <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                  No data recorded
                </span>
              </div>
            ) : (
              <>
                {/* Subject Attendance Records */}
                {records.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-gray-600 px-1">
                      Attendance
                    </span>
                    {records.map((record) => {
                      const subject =
                        typeof record.subjectId === "object"
                          ? record.subjectId
                          : null;

                      return (
                        <AcrylicBlock
                          key={record._id}
                          className="p-3"
                          borderColor={subject?.color}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{
                                  backgroundColor: subject?.color || "#805af2",
                                  boxShadow: `0 0 6px ${subject?.color || "#805af2"}40`,
                                }}
                              />
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-mono text-gray-200 truncate">
                                  {subject?.name || "Unknown"}
                                </span>
                                {subject?.startTime && subject?.endTime && (
                                  <span className="text-[9px] font-mono text-gray-600">
                                    {subject.startTime} — {subject.endTime}
                                  </span>
                                )}
                              </div>
                            </div>
                            <StatusBadge status={record.status} />
                          </div>
                        </AcrylicBlock>
                      );
                    })}
                  </div>
                )}

                {/* Day Summary Stats */}
                {dayData && (
                  <GlassPanel className="p-3">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-gray-600 block mb-2">
                      Day Summary
                    </span>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col items-center">
                        <MaterialIcon
                          name="check_circle"
                          filled
                          size={16}
                          className="text-green-500/70 mb-1"
                        />
                        <span className="text-sm font-mono font-bold text-white">
                          {dayData.attended}
                          <span className="text-gray-600 text-[10px]">
                            /{dayData.scheduled}
                          </span>
                        </span>
                        <span className="text-[8px] font-mono text-gray-600 uppercase tracking-wider">
                          Attend
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <MaterialIcon
                          name="timer"
                          size={16}
                          className="text-blue-400/70 mb-1"
                        />
                        <span className="text-sm font-mono font-bold text-white">
                          {dayData.focusMinutes}
                          <span className="text-gray-600 text-[10px]">m</span>
                        </span>
                        <span className="text-[8px] font-mono text-gray-600 uppercase tracking-wider">
                          Focus
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <MaterialIcon
                          name="bolt"
                          filled
                          size={16}
                          className="text-yellow-500/70 mb-1"
                        />
                        <span className="text-sm font-mono font-bold text-white">
                          {dayData.xp}
                        </span>
                        <span className="text-[8px] font-mono text-gray-600 uppercase tracking-wider">
                          XP
                        </span>
                      </div>
                    </div>
                  </GlassPanel>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
