import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import User from "@/lib/db/models/User";
import { calculateAttendancePercentage } from "@/lib/gamification";
import { NextResponse } from "next/server";

// GET /api/user/stats — get current user's stats
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(session.user.id)
    .select("name email image xp currentStreak longestStreak totalAttendanceDays totalScheduledDays")
    .lean();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      ...user,
      _id: (user._id as any).toString(),
      attendancePercentage: calculateAttendancePercentage(
        user.totalAttendanceDays || 0,
        user.totalScheduledDays || 0
      ),
    },
  });
}
