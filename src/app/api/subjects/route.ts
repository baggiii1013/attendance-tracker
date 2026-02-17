import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import Subject from "@/lib/db/models/Subject";
import { NextRequest, NextResponse } from "next/server";

// GET /api/subjects — list all subjects for current user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const subjects = await Subject.find({ userId: session.user.id, isActive: true }).sort({ startTime: 1 });
  return NextResponse.json({ subjects });
}

// POST /api/subjects — create a new subject
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, startTime, endTime, activeDays, color } = body;

  if (!name || !startTime || !endTime || !activeDays?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await connectDB();
  const subject = await Subject.create({
    userId: session.user.id,
    name,
    startTime,
    endTime,
    activeDays,
    color: color || "#805af2",
    isActive: true,
  });

  return NextResponse.json({ subject }, { status: 201 });
}
