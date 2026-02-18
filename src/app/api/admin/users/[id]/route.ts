import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import AttendanceRecord from "@/lib/db/models/AttendanceRecord";
import FocusSession from "@/lib/db/models/FocusSession";
import Subject from "@/lib/db/models/Subject";
import User from "@/lib/db/models/User";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/users/[id] — get user detail with full stats
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { id } = await params;
  await connectDB();

  const user = await User.findById(id)
    .select("-__v")
    .lean();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [subjects, attendanceCount, focusCount, totalFocusMinutes] =
    await Promise.all([
      Subject.find({ userId: id })
        .select("name color isActive schedules createdAt")
        .lean(),
      AttendanceRecord.countDocuments({ userId: id }),
      FocusSession.countDocuments({ userId: id, completed: true }),
      FocusSession.aggregate([
        { $match: { userId: id, completed: true } },
        { $group: { _id: null, total: { $sum: "$duration" } } },
      ]),
    ]);

  return NextResponse.json({
    user: {
      ...user,
      _id: user._id.toString(),
    },
    subjects: subjects.map((s) => ({
      ...s,
      _id: s._id.toString(),
    })),
    stats: {
      totalAttendanceRecords: attendanceCount,
      totalFocusSessions: focusCount,
      totalFocusMinutes: totalFocusMinutes[0]?.total || 0,
      totalSubjects: subjects.length,
      activeSubjects: subjects.filter((s) => s.isActive).length,
    },
  });
}

// PUT /api/admin/users/[id] — update user (role, isDisabled, etc.)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { id } = await params;
  const body = await req.json();

  // Only allow updating specific fields
  const allowedFields = ["role", "isDisabled", "name"];
  const updates: any = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  await connectDB();

  const user = await User.findByIdAndUpdate(id, updates, { new: true })
    .select("-__v")
    .lean();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user: { ...user, _id: user._id.toString() } });
}

// DELETE /api/admin/users/[id] — delete user and all associated data
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { id } = await params;
  await connectDB();

  const user = await User.findById(id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Delete all associated data
  await Promise.all([
    AttendanceRecord.deleteMany({ userId: id }),
    Subject.deleteMany({ userId: id }),
    FocusSession.deleteMany({ userId: id }),
    User.findByIdAndDelete(id),
  ]);

  return NextResponse.json({ success: true });
}
