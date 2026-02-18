import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import AttendanceRecord from "@/lib/db/models/AttendanceRecord";
import User from "@/lib/db/models/User";
import { reverseXP } from "@/lib/gamification";
import { NextRequest, NextResponse } from "next/server";

// DELETE /api/admin/users/[id]/attendance/[recordId] — delete a specific attendance record
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { id, recordId } = await params;
  await connectDB();

  const record = await AttendanceRecord.findOne({
    _id: recordId,
    userId: id,
  });

  if (!record) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  // Reverse XP earned from this record
  if (record.xpEarned && record.xpEarned > 0) {
    await reverseXP(id, record.xpEarned);
  }

  // Decrement user stats
  if (record.status === "present" || record.status === "late") {
    await User.findByIdAndUpdate(id, {
      $inc: { totalAttendanceDays: -1, totalScheduledDays: -1 },
    });
  } else {
    await User.findByIdAndUpdate(id, {
      $inc: { totalScheduledDays: -1 },
    });
  }

  await AttendanceRecord.findByIdAndDelete(recordId);

  return NextResponse.json({ success: true });
}
