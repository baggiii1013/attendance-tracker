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
  const { name, startTime, endTime, activeDays, color, isActive } = body;

  await connectDB();
  const subject = await Subject.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    {
      ...(name !== undefined && { name }),
      ...(startTime !== undefined && { startTime }),
      ...(endTime !== undefined && { endTime }),
      ...(activeDays !== undefined && { activeDays }),
      ...(color !== undefined && { color }),
      ...(isActive !== undefined && { isActive }),
    },
    { new: true }
  );

  if (!subject) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

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
