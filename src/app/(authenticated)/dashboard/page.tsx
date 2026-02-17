import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import AttendanceRecord from "@/lib/db/models/AttendanceRecord";
import Subject from "@/lib/db/models/Subject";
import User from "@/lib/db/models/User";
import { calculateAttendancePercentage } from "@/lib/gamification";
import Link from "next/link";
import DashboardClient from "./DashboardClient";

async function getDashboardData(userId: string) {
  await connectDB();

  const user = await User.findById(userId).lean();
  if (!user) return null;

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

  // Map subjects with today's status
  const subjectsWithStatus = subjects.map((subject) => {
    const record = todayRecords.find(
      (r) => r.subjectId.toString() === subject._id.toString()
    );

    const isScheduledToday = subject.activeDays.includes(todayDay);
    const now = new Date();
    const [startH, startM] = subject.startTime.split(":").map(Number);
    const [endH, endM] = subject.endTime.split(":").map(Number);
    const startDate = new Date(now);
    startDate.setHours(startH, startM, 0, 0);
    const endDate = new Date(now);
    endDate.setHours(endH, endM, 0, 0);

    let sessionStatus: "active" | "upcoming" | "completed" | "inactive" = "inactive";
    if (isScheduledToday) {
      if (now >= startDate && now <= endDate) sessionStatus = "active";
      else if (now < startDate) sessionStatus = "upcoming";
      else sessionStatus = "completed";
    }

    return {
      _id: subject._id.toString(),
      name: subject.name,
      startTime: subject.startTime,
      endTime: subject.endTime,
      activeDays: subject.activeDays,
      color: subject.color,
      isScheduledToday,
      sessionStatus,
      attendanceMarked: !!record,
      attendanceStatus: record?.status || null,
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
      xp: user.xp,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      totalAttendanceDays: user.totalAttendanceDays,
      attendancePercent,
    },
    subjects: subjectsWithStatus,
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
