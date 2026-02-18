import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import AttendanceRecord from "@/lib/db/models/AttendanceRecord";
import Subject from "@/lib/db/models/Subject";
import User from "@/lib/db/models/User";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/users — list all users with summary stats
export async function GET(req: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const search = req.nextUrl.searchParams.get("search") || "";
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50", 10);
  const skip = (page - 1) * limit;

  await connectDB();

  const filter: any = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("name email image role isDisabled xp currentStreak longestStreak totalAttendanceDays totalScheduledDays createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  // Get subject count and recent attendance for each user
  const enrichedUsers = await Promise.all(
    users.map(async (user) => {
      const [subjectCount, recentAttendance] = await Promise.all([
        Subject.countDocuments({ userId: user._id, isActive: true }),
        AttendanceRecord.countDocuments({
          userId: user._id,
          date: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // last 30 days
          },
        }),
      ]);

      return {
        ...user,
        _id: user._id.toString(),
        subjectCount,
        recentAttendance,
      };
    })
  );

  return NextResponse.json({
    users: enrichedUsers,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
