import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import AttendanceRecord from "@/lib/db/models/AttendanceRecord";
import User from "@/lib/db/models/User";
import { awardXP, reverseXP, XP_ATTENDANCE_MARK } from "@/lib/gamification";
import { updateStreak } from "@/lib/streak";
import { NextRequest, NextResponse } from "next/server";

// GET /api/attendance?date=YYYY-MM-DD — get attendance records for a date
// GET /api/attendance?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD — get attendance records for a date range
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startDateParam = req.nextUrl.searchParams.get("startDate");
  const endDateParam = req.nextUrl.searchParams.get("endDate");

  await connectDB();

  // Range query mode
  if (startDateParam && endDateParam) {
    const startDate = new Date(startDateParam);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(endDateParam);
    endDate.setHours(23, 59, 59, 999);

    const records = await AttendanceRecord.find({
      userId: session.user.id,
      date: { $gte: startDate, $lte: endDate },
    }).populate("subjectId", "name color schedules");

    return NextResponse.json({ records });
  }

  // Single date mode (existing behavior)
  const dateParam = req.nextUrl.searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : new Date();
  date.setHours(0, 0, 0, 0);

  const records = await AttendanceRecord.find({
    userId: session.user.id,
    date,
  });

  return NextResponse.json({ records });
}

// POST /api/attendance — mark attendance for a subject (toggleable)
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
    // Toggle off if same status
    if (existing.status === status) {
      const xpToReverse = existing.xpEarned || 0;
      await AttendanceRecord.deleteOne({ _id: existing._id });

      // Reverse stats
      const updates: Record<string, number> = { totalScheduledDays: -1 };
      if (existing.status === "present") {
        updates.totalAttendanceDays = -1;
      }
      await User.findByIdAndUpdate(session.user.id, { $inc: updates });

      // Reverse XP if any was earned
      if (xpToReverse > 0) {
        await reverseXP(session.user.id, xpToReverse);
      }

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

  // Award XP for attendance
  if (xpEarned > 0) {
    await awardXP(session.user.id, xpEarned);
  }

  // Update streak (no side effects — only returns info)
  if (status === "present") {
    const streakResult = await updateStreak(session.user.id);
    if (streakResult.streakBonus > 0) {
      await awardXP(session.user.id, streakResult.streakBonus);
      // Update xpEarned on record to include streak bonus for accurate reversal
      record.xpEarned = xpEarned + streakResult.streakBonus;
      await record.save();
    }
  }

  // Update totalScheduledDays and totalAttendanceDays (single place, no duplication)
  await User.findByIdAndUpdate(session.user.id, {
    $inc: {
      totalScheduledDays: 1,
      ...(status === "present" ? { totalAttendanceDays: 1 } : {}),
    },
  });

  return NextResponse.json({ action: "created", record }, { status: 201 });
}

// DELETE /api/attendance — remove a specific attendance record
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const subjectId = searchParams.get("subjectId");

  if (!subjectId) {
    return NextResponse.json({ error: "Missing subjectId" }, { status: 400 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await connectDB();

  const existing = await AttendanceRecord.findOne({
    userId: session.user.id,
    subjectId,
    date: today,
  });

  if (!existing) {
    return NextResponse.json({ error: "No record found" }, { status: 404 });
  }

  const xpToReverse = existing.xpEarned || 0;
  const wasPresent = existing.status === "present";

  await AttendanceRecord.deleteOne({ _id: existing._id });

  // Reverse stats
  const updates: Record<string, number> = { totalScheduledDays: -1 };
  if (wasPresent) {
    updates.totalAttendanceDays = -1;
  }
  await User.findByIdAndUpdate(session.user.id, { $inc: updates });

  // Reverse XP
  if (xpToReverse > 0) {
    await reverseXP(session.user.id, xpToReverse);
  }

  return NextResponse.json({ action: "removed", record: null });
}
