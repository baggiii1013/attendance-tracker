import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import User from "@/lib/db/models/User";
import { calculateAttendancePercentage } from "@/lib/gamification";
import { NextRequest, NextResponse } from "next/server";

type SortField = "currentStreak" | "xp" | "attendancePercentage";

// GET /api/leaderboard?metric=streak|xp|attendance
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUserId = session.user.id;
  const metric = req.nextUrl.searchParams.get("metric") || "streak";

  await connectDB();

  // Determine sort field
  let sortField: SortField;
  switch (metric) {
    case "xp":
      sortField = "xp";
      break;
    case "attendance":
      sortField = "attendancePercentage";
      break;
    default:
      sortField = "currentStreak";
  }

  // For attendance percentage, we need to calculate it
  if (sortField === "attendancePercentage") {
    const users = await User.find({})
      .select("name image xp currentStreak totalAttendanceDays totalScheduledDays")
      .lean();

    const withPercentage = users
      .map((u) => ({
        _id: (u._id as any).toString(),
        name: u.name || "Anonymous",
        image: u.image || "",
        currentStreak: u.currentStreak || 0,
        xp: u.xp || 0,
        attendancePercentage: calculateAttendancePercentage(
          u.totalAttendanceDays || 0,
          u.totalScheduledDays || 0
        ),
        isCurrentUser: (u._id as any).toString() === currentUserId,
      }))
      .sort((a, b) => b.attendancePercentage - a.attendancePercentage)
      .slice(0, 50)
      .map((entry, i) => ({ ...entry, rank: i + 1 }));

    return NextResponse.json({ entries: withPercentage });
  }

  // For streak and XP, we can sort directly
  const users = await User.find({})
    .select("name image xp currentStreak totalAttendanceDays totalScheduledDays")
    .sort({ [sortField]: -1 })
    .limit(50)
    .lean();

  const entries = users.map((u, i) => ({
    _id: (u._id as any).toString(),
    name: u.name || "Anonymous",
    image: u.image || "",
    currentStreak: u.currentStreak || 0,
    xp: u.xp || 0,
    attendancePercentage: calculateAttendancePercentage(
      u.totalAttendanceDays || 0,
      u.totalScheduledDays || 0
    ),
    rank: i + 1,
    isCurrentUser: (u._id as any).toString() === currentUserId,
  }));

  return NextResponse.json({ entries });
}
