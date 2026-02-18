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

    // Get the current schedule (effectiveTo === null)
    const currentSchedule = getScheduleForDate(subject.schedules || [], new Date());
    const todaySlots = currentSchedule
      ? currentSchedule.slots.filter((s: IScheduleSlot) => s.day === todayDay)
      : [];

    const isScheduledToday = todaySlots.length > 0;

    // Determine session status based on current time vs slot times
    const now = new Date();
    let sessionStatus: "active" | "upcoming" | "completed" | "inactive" = "inactive";

    if (isScheduledToday && todaySlots.length > 0) {
      // Use the earliest slot to determine status
      const sortedSlots = [...todaySlots].sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      );

      let hasActive = false;
      let hasUpcoming = false;
      let allCompleted = true;

      for (const slot of sortedSlots) {
        const [startH, startM] = slot.startTime.split(":").map(Number);
        const [endH, endM] = slot.endTime.split(":").map(Number);
        const startDate = new Date(now);
        startDate.setHours(startH, startM, 0, 0);
        const endDate = new Date(now);
        endDate.setHours(endH, endM, 0, 0);

        if (now >= startDate && now <= endDate) {
          hasActive = true;
          allCompleted = false;
        } else if (now < startDate) {
          hasUpcoming = true;
          allCompleted = false;
        }
      }

      if (hasActive) sessionStatus = "active";
      else if (hasUpcoming) sessionStatus = "upcoming";
      else if (allCompleted) sessionStatus = "completed";
    }

    // Build display time from first slot
    const firstSlot = todaySlots[0] || (currentSchedule?.slots?.[0]);
    const displayTime = firstSlot
      ? `${firstSlot.startTime} — ${firstSlot.endTime}`
      : "";

    return {
      _id: subject._id.toString(),
      name: subject.name,
      slots: todaySlots.map((s: IScheduleSlot) => ({
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
      displayTime,
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
      role: user.role || "user",
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
