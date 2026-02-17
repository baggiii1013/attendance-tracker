import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import AttendanceRecord from "@/lib/db/models/AttendanceRecord";
import User from "@/lib/db/models/User";
import { awardXP, XP_ATTENDANCE_MARK } from "@/lib/gamification";
import { updateStreak } from "@/lib/streak";
import { NextRequest, NextResponse } from "next/server";

// GET /api/attendance?date=YYYY-MM-DD — get attendance records for a date
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dateParam = req.nextUrl.searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : new Date();
  date.setHours(0, 0, 0, 0);

  await connectDB();
  const records = await AttendanceRecord.find({
    userId: session.user.id,
    date,
  });

  return NextResponse.json({ records });
}

// POST /api/attendance — mark attendance for a subject
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { subjectId, status } = body;

  if (!subjectId || !status) {
    return NextResponse.json({ error: "Missing subjectId or status" }, { status: 400 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await connectDB();

  // Check if already marked
  const existing = await AttendanceRecord.findOne({
    userId: session.user.id,
    subjectId,
    date: today,
  });

  if (existing) {
    // Toggle off if same status, otherwise update
    if (existing.status === status) {
      await AttendanceRecord.deleteOne({ _id: existing._id });
      // Decrement attendance count
      await User.findByIdAndUpdate(session.user.id, {
        $inc: { totalAttendanceDays: -1 },
      });
      return NextResponse.json({ action: "removed", record: null });
    }
    // Update status
    existing.status = status;
    await existing.save();
    return NextResponse.json({ action: "updated", record: existing });
  }

  // Create new record
  const xpEarned = status === "present" ? XP_ATTENDANCE_MARK : 0;
  const record = await AttendanceRecord.create({
    userId: session.user.id,
    subjectId,
    date: today,
    status,
    markedAt: new Date(),
    xpEarned,
  });

  // Award XP and update streak
  if (status === "present") {
    await awardXP(session.user.id, xpEarned);
    const streakResult = await updateStreak(session.user.id);
    if (streakResult.streakBonus > 0) {
      await awardXP(session.user.id, streakResult.streakBonus);
    }
  }

  // Update totalScheduledDays and totalAttendanceDays
  await User.findByIdAndUpdate(session.user.id, {
    $inc: {
      totalScheduledDays: 1,
      ...(status === "present" ? { totalAttendanceDays: 1 } : {}),
    },
  });

  return NextResponse.json({ action: "created", record }, { status: 201 });
}
