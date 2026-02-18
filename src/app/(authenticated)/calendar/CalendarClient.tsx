"use client";

import BrushedSteelHeader from "@/components/ui/BrushedSteelHeader";
import { GlassIconButton } from "@/components/ui/Icons";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import CalendarGrid from "./CalendarGrid";
import DayDetailSheet from "./DayDetailSheet";
import MonthlyStats from "./MonthlyStats";
import SubjectBreakdown from "./SubjectBreakdown";

export interface AttendanceRecord {
  _id: string;
  date: string;
  status: "present" | "absent" | "late";
  xpEarned: number;
  subjectId: {
    _id: string;
    name: string;
    color: string;
    startTime: string;
    endTime: string;
    activeDays: string[];
  } | string;
}

export interface DayData {
  attended: number;
  scheduled: number;
  xp: number;
  focusMinutes: number;
}

export interface SubjectBreakdownData {
  _id: string;
  name: string;
  color: string;
  scheduledDays: number;
  present: number;
  absent: number;
  late: number;
}

export interface MonthlyStatsData {
  attendanceRate: number;
  currentStreak: number;
  longestStreak: number;
  totalFocusMinutes: number;
  xpEarned: number;
  subjectBreakdown: SubjectBreakdownData[];
  dayMap: Record<string, DayData>;
}

export default function CalendarClient() {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [direction, setDirection] = useState(0); // -1 = prev, 1 = next
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const fetchData = useCallback(async (month: Date) => {
    setLoading(true);
    try {
      const start = format(startOfMonth(month), "yyyy-MM-dd");
      const end = format(endOfMonth(month), "yyyy-MM-dd");
      const m = month.getMonth();
      const y = month.getFullYear();

      const [attendanceRes, statsRes] = await Promise.all([
        fetch(`/api/attendance?startDate=${start}&endDate=${end}`),
        fetch(`/api/attendance/monthly-stats?month=${m}&year=${y}`),
      ]);

      if (attendanceRes.ok) {
        const data = await attendanceRes.json();
        setRecords(data.records || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setMonthlyStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch calendar data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(currentMonth);
  }, [currentMonth, fetchData]);

  const goToPrevMonth = () => {
    setDirection(-1);
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setDirection(1);
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const handleDaySelect = (date: Date) => {
    setSelectedDay(date);
  };

  const handleCloseSheet = () => {
    setSelectedDay(null);
  };

  // Get records for the selected day
  const selectedDayRecords = selectedDay
    ? records.filter((r) => {
        const recDate = new Date(r.date);
        return (
          recDate.getFullYear() === selectedDay.getFullYear() &&
          recDate.getMonth() === selectedDay.getMonth() &&
          recDate.getDate() === selectedDay.getDate()
        );
      })
    : [];

  const selectedDayData = selectedDay && monthlyStats?.dayMap
    ? monthlyStats.dayMap[format(selectedDay, "yyyy-MM-dd")] || null
    : null;

  return (
    <>
      {/* Header */}
      <BrushedSteelHeader>
        <div className="flex items-center justify-between w-full">
          <GlassIconButton
            icon="chevron_left"
            onClick={goToPrevMonth}
            ariaLabel="Previous month"
          />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={format(currentMonth, "yyyy-MM")}
              initial={{ x: direction * 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction * -40, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex flex-col items-center"
            >
              <h1 className="text-[10px] font-mono etched-text uppercase tracking-[0.2em]">
                CHRONO_LOG
              </h1>
              <span className="text-lg font-bold text-gray-200 tracking-tight font-mono">
                {format(currentMonth, "MMMM yyyy").toUpperCase()}
              </span>
            </motion.div>
          </AnimatePresence>
          <GlassIconButton
            icon="chevron_right"
            onClick={goToNextMonth}
            ariaLabel="Next month"
          />
        </div>
      </BrushedSteelHeader>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 pb-28 pt-6 no-scrollbar bg-[#0d0d0f]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-gray-700 border-t-[#805af2] animate-spin" />
            <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
              Loading data...
            </span>
          </div>
        ) : (
          <>
            {/* Monthly Stats */}
            {monthlyStats && <MonthlyStats data={monthlyStats} />}

            {/* Calendar Grid */}
            <CalendarGrid
              currentMonth={currentMonth}
              direction={direction}
              dayMap={monthlyStats?.dayMap || {}}
              records={records}
              onDaySelect={handleDaySelect}
              selectedDay={selectedDay}
            />

            {/* Subject Breakdown */}
            {monthlyStats && monthlyStats.subjectBreakdown.length > 0 && (
              <SubjectBreakdown subjects={monthlyStats.subjectBreakdown} />
            )}
          </>
        )}
      </main>

      {/* Day Detail Bottom Sheet */}
      <AnimatePresence>
        {selectedDay && (
          <DayDetailSheet
            date={selectedDay}
            records={selectedDayRecords}
            dayData={selectedDayData}
            onClose={handleCloseSheet}
          />
        )}
      </AnimatePresence>
    </>
  );
}
