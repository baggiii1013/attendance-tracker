import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import AttendanceRecord from "@/lib/db/models/AttendanceRecord";
import FocusSession from "@/lib/db/models/FocusSession";
import Subject from "@/lib/db/models/Subject";
import User from "@/lib/db/models/User";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
} from "date-fns";
import { NextRequest, NextResponse } from "next/server";

const DAY_MAP: Record<number, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

// GET /api/attendance/monthly-stats?month=1&year=2026
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const monthParam = req.nextUrl.searchParams.get("month");
  const yearParam = req.nextUrl.searchParams.get("year");

  if (!monthParam || !yearParam) {
    return NextResponse.json(
      { error: "Missing month or year parameter" },
      { status: 400 }
    );
  }

  const month = parseInt(monthParam, 10); // 0-indexed
  const year = parseInt(yearParam, 10);
  const targetDate = new Date(year, month, 1);
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);

  await connectDB();

  // Fetch all data in parallel
  const [attendanceRecords, focusSessions, subjects, user] = await Promise.all(
    [
      AttendanceRecord.find({
        userId: session.user.id,
        date: { $gte: monthStart, $lte: monthEnd },
      })
        .populate("subjectId", "name color")
        .lean(),

      FocusSession.find({
        userId: session.user.id,
        completed: true,
        completedAt: { $gte: monthStart, $lte: monthEnd },
      }).lean(),

      Subject.find({
        userId: session.user.id,
        isActive: true,
      }).lean(),

      User.findById(session.user.id)
        .select("currentStreak longestStreak")
        .lean(),
    ]
  );

  // Calculate days of the month
  const daysInMonth = eachDayOfInterval({
    start: monthStart,
    end: monthEnd,
  });

  // Build subject breakdown: for each subject, how many scheduled days are in this month, and how many present/absent/late
  const subjectBreakdown = subjects.map((subject) => {
    const activeDaysSet = new Set(subject.activeDays);

    // Count scheduled days this month for this subject
    const scheduledDays = daysInMonth.filter((day) =>
      activeDaysSet.has(DAY_MAP[getDay(day)])
    ).length;

    // Count attendance statuses for this subject this month
    const subjectRecords = attendanceRecords.filter(
      (r: any) =>
        r.subjectId?._id?.toString() === subject._id.toString() ||
        r.subjectId?.toString() === subject._id.toString()
    );

    const present = subjectRecords.filter(
      (r: any) => r.status === "present"
    ).length;
    const absent = subjectRecords.filter(
      (r: any) => r.status === "absent"
    ).length;
    const late = subjectRecords.filter(
      (r: any) => r.status === "late"
    ).length;

    return {
      _id: subject._id.toString(),
      name: subject.name,
      color: subject.color,
      scheduledDays,
      present,
      absent,
      late,
    };
  });

  // Calculate overall attendance rate for the month
  const totalScheduled = subjectBreakdown.reduce(
    (sum, s) => sum + s.scheduledDays,
    0
  );
  const totalPresent = subjectBreakdown.reduce(
    (sum, s) => sum + s.present,
    0
  );
  const attendanceRate =
    totalScheduled > 0 ? Math.round((totalPresent / totalScheduled) * 100) : 0;

  // Focus time for the month
  const totalFocusMinutes = focusSessions.reduce(
    (sum, s: any) => sum + (s.duration || 0),
    0
  );

  // XP earned this month
  const attendanceXP = attendanceRecords.reduce(
    (sum, r: any) => sum + (r.xpEarned || 0),
    0
  );
  const focusXP = focusSessions.reduce(
    (sum, s: any) => sum + (s.xpEarned || 0),
    0
  );
  const xpEarned = attendanceXP + focusXP;

  // Build per-day map for heatmap data
  const dayMap: Record<
    string,
    { attended: number; scheduled: number; xp: number; focusMinutes: number }
  > = {};

  for (const day of daysInMonth) {
    const dayKey = format(day, "yyyy-MM-dd");
    const dayName = DAY_MAP[getDay(day)];

    const scheduledCount = subjects.filter((s) =>
      s.activeDays.includes(dayName)
    ).length;

    const dayRecords = attendanceRecords.filter(
      (r: any) =>
        format(new Date(r.date), "yyyy-MM-dd") === dayKey
    );

    const attendedCount = dayRecords.filter(
      (r: any) => r.status === "present" || r.status === "late"
    ).length;

    const dayXP = dayRecords.reduce(
      (sum, r: any) => sum + (r.xpEarned || 0),
      0
    );

    const dayFocusSessions = focusSessions.filter(
      (s: any) =>
        s.completedAt && format(new Date(s.completedAt), "yyyy-MM-dd") === dayKey
    );

    const dayFocusMinutes = dayFocusSessions.reduce(
      (sum, s: any) => sum + (s.duration || 0),
      0
    );

    dayMap[dayKey] = {
      attended: attendedCount,
      scheduled: scheduledCount,
      xp: dayXP,
      focusMinutes: dayFocusMinutes,
    };
  }

  return NextResponse.json({
    attendanceRate,
    currentStreak: user?.currentStreak ?? 0,
    longestStreak: user?.longestStreak ?? 0,
    totalFocusMinutes,
    xpEarned,
    subjectBreakdown,
    dayMap,
  });
}
