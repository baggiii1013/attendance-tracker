import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import Subject from "@/lib/db/models/Subject";
import { NextRequest, NextResponse } from "next/server";

// GET /api/subjects/[id] — get a single subject
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();
  const subject = await Subject.findOne({ _id: id, userId: session.user.id });

  if (!subject) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  return NextResponse.json({ subject });
}

// PUT /api/subjects/[id] — update a subject
// If schedule (slots) changes, archives old schedule and creates new one
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, slots, color, isActive } = body;

  await connectDB();
  const subject = await Subject.findOne({ _id: id, userId: session.user.id });

  if (!subject) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  // Update simple fields
  if (name !== undefined) subject.name = name;
  if (color !== undefined) subject.color = color;
  if (isActive !== undefined) subject.isActive = isActive;

  // Handle schedule change — archive old, create new
  if (slots && Array.isArray(slots) && slots.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the current active schedule and archive it
    const currentScheduleIdx = subject.schedules.findIndex(
      (s) => s.effectiveTo === null
    );
    if (currentScheduleIdx >= 0) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      subject.schedules[currentScheduleIdx].effectiveTo = yesterday;
    }

    // Add new schedule entry
    subject.schedules.push({
      slots,
      effectiveFrom: today,
      effectiveTo: null,
    });
  }

  await subject.save();
  return NextResponse.json({ subject });
}

// DELETE /api/subjects/[id] — soft-delete a subject (set isActive: false)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();
  const subject = await Subject.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    { isActive: false },
    { new: true }
  );

  if (!subject) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Subject deactivated" });
}
