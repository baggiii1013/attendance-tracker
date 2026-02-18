import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import AttendanceRecord from "@/lib/db/models/AttendanceRecord";
import Subject, { getScheduleForDate, IScheduleSlot } from "@/lib/db/models/Subject";
import User from "@/lib/db/models/User";
import { calculateAttendancePercentage } from "@/lib/gamification";
import DashboardClient from "./DashboardClient";

async function getDashboardData(userId: string) {
  await connectDB();

  const user = await User.findById(userId).lean();
  if (!user) return null;

  const maxSessions = user.maxSessionsPerDay ?? 8;

  const subjects = await Subject.find({ userId, isActive: true })
    .sort({ createdAt: -1 })
    .lean();

  // Today's attendance records
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayRecords = await AttendanceRecord.find({
    userId,
    date: { $gte: today, $lt: tomorrow },
  }).lean();

  // Get day name for today
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayDay = dayNames[new Date().getDay()];

  // Build a session grid: for each sessionNumber 1..maxSessions,
  // figure out which subject (if any) is assigned to that slot today.
  type SessionSlot = {
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

  const sessions: SessionSlot[] = [];

  for (let sn = 1; sn <= maxSessions; sn++) {
    let matchedSubject: SessionSlot["subject"] = null;
    let record = null;

    // Find which subject occupies this session slot on today's day
    for (const subject of subjects) {
      const currentSchedule = getScheduleForDate(
        subject.schedules || [],
        new Date()
      );
      if (!currentSchedule) continue;

      const matchingSlot = currentSchedule.slots.find(
        (s: IScheduleSlot) => s.day === todayDay && s.sessionNumber === sn
      );
      if (matchingSlot) {
        matchedSubject = {
          _id: subject._id.toString(),
          name: subject.name,
          color: subject.color,
          startTime: matchingSlot.startTime,
          endTime: matchingSlot.endTime,
        };
        // Find attendance record for this subject+session
        record =
          todayRecords.find(
            (r) =>
              r.subjectId.toString() === subject._id.toString() &&
              r.sessionNumber === sn
          ) || null;
        break;
      }
    }

    sessions.push({
      sessionNumber: sn,
      subject: matchedSubject,
      attendanceMarked: !!record,
      attendanceStatus: record?.status || null,
    });
  }

  // Build subjects list for edit/delete access
  const subjectsList = subjects.map((subject) => {
    const currentSchedule = getScheduleForDate(
      subject.schedules || [],
      new Date()
    );
    const todaySlots = currentSchedule
      ? currentSchedule.slots.filter((s: IScheduleSlot) => s.day === todayDay)
      : [];

    return {
      _id: subject._id.toString(),
      name: subject.name,
      color: subject.color,
      isScheduledToday: todaySlots.length > 0,
      totalSlots: currentSchedule?.slots?.length || 0,
    };
  });

  const attendancePercent = calculateAttendancePercentage(
    user.totalAttendanceDays,
    user.totalScheduledDays || 1
  );

  return {
    user: {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image || null,
      role: user.role || "user",
      xp: user.xp,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      totalAttendanceDays: user.totalAttendanceDays,
      attendancePercent,
    },
    sessions,
    subjects: subjectsList,
    maxSessionsPerDay: maxSessions,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const data = await getDashboardData(session.user.id);
  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 font-mono">Loading system...</p>
      </div>
    );
  }

  return <DashboardClient data={data} />;
}
