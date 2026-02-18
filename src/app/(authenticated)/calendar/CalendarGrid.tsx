"use client";

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
} from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import type { AttendanceRecord, DayData } from "./CalendarClient";

const WEEKDAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

interface CalendarGridProps {
  currentMonth: Date;
  direction: number;
  dayMap: Record<string, DayData>;
  records: AttendanceRecord[];
  onDaySelect: (date: Date) => void;
  selectedDay: Date | null;
}

function getHeatmapOpacity(dayData: DayData | undefined): number {
  if (!dayData || dayData.scheduled === 0) return 0;
  const ratio = dayData.attended / dayData.scheduled;
  if (ratio === 0) return 0;
  if (ratio <= 0.33) return 0.12;
  if (ratio <= 0.66) return 0.25;
  if (ratio < 1) return 0.35;
  return 0.5; // 100% attendance
}

function getSubjectDotsForDay(
  dateStr: string,
  records: AttendanceRecord[]
): Array<{ color: string; status: string }> {
  const dayRecords = records.filter(
    (r) => format(new Date(r.date), "yyyy-MM-dd") === dateStr
  );

  return dayRecords
    .map((r) => {
      const subject = typeof r.subjectId === "object" ? r.subjectId : null;
      return {
        color: subject?.color || "#805af2",
        status: r.status,
      };
    })
    .slice(0, 4); // Max 4 dots
}

export default function CalendarGrid({
  currentMonth,
  direction,
  dayMap,
  records,
  onDaySelect,
  selectedDay,
}: CalendarGridProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  // Week starts on Monday
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div className="mb-6">
      {/* Weekday Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-[9px] font-mono uppercase tracking-widest text-gray-600 py-1"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={format(currentMonth, "yyyy-MM")}
          initial={{ x: direction * 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction * -60, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="grid grid-cols-7 gap-1"
        >
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const inCurrentMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);
            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
            const dayData = dayMap[dateStr];
            const heatOpacity = getHeatmapOpacity(dayData);
            const dots = inCurrentMonth ? getSubjectDotsForDay(dateStr, records) : [];
            const hasData = dots.length > 0 || (dayData && (dayData.focusMinutes > 0 || dayData.xp > 0));

            return (
              <button
                key={dateStr}
                onClick={() => inCurrentMonth && onDaySelect(day)}
                disabled={!inCurrentMonth}
                className={`
                  relative flex flex-col items-center justify-center
                  aspect-square rounded-lg transition-all duration-150
                  ${inCurrentMonth ? "cursor-pointer hover:bg-white/5" : "opacity-20 cursor-default"}
                  ${isSelected ? "ring-1 ring-[#805af2]/70 bg-white/5" : ""}
                  ${today ? "ring-1 ring-[#805af2]/40" : ""}
                `}
              >
                {/* Heatmap background */}
                {heatOpacity > 0 && (
                  <div
                    className="absolute inset-0.5 rounded-md"
                    style={{
                      backgroundColor: `rgba(128, 90, 242, ${heatOpacity})`,
                    }}
                  />
                )}

                {/* Day Number */}
                <span
                  className={`
                    relative z-10 text-xs font-mono leading-none
                    ${today ? "text-[#805af2] font-bold" : ""}
                    ${!today && inCurrentMonth ? "text-gray-300" : ""}
                    ${!inCurrentMonth ? "text-gray-700" : ""}
                    ${isSelected ? "text-white" : ""}
                  `}
                >
                  {format(day, "d")}
                </span>

                {/* Subject Dots */}
                {dots.length > 0 && (
                  <div className="relative z-10 flex items-center gap-[2px] mt-0.5">
                    {dots.map((dot, i) => (
                      <span
                        key={i}
                        className={`
                          w-[5px] h-[5px] rounded-full shrink-0
                          ${dot.status === "present" ? "" : ""}
                          ${dot.status === "absent" ? "ring-1 ring-current bg-transparent" : ""}
                          ${dot.status === "late" ? "opacity-70" : ""}
                        `}
                        style={{
                          backgroundColor: dot.status !== "absent" ? dot.color : "transparent",
                          color: dot.color,
                        }}
                      />
                    ))}
                    {records.filter(
                      (r) => format(new Date(r.date), "yyyy-MM-dd") === dateStr
                    ).length > 4 && (
                      <span className="text-[7px] font-mono text-gray-500">
                        +{records.filter(
                          (r) => format(new Date(r.date), "yyyy-MM-dd") === dateStr
                        ).length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* Focus indicator (small bar) */}
                {!dots.length && hasData && dayData?.focusMinutes && dayData.focusMinutes > 0 && (
                  <div className="relative z-10 w-2 h-[2px] rounded-full bg-blue-500/60 mt-0.5" />
                )}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
