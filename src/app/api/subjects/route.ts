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
  const subjects = await Subject.find({
    userId: session.user.id,
    isActive: true,
  }).sort({ createdAt: -1 });

  return NextResponse.json({ subjects });
}

// POST /api/subjects — create a new subject with schedule slots
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, slots, color } = body;

  if (!name || !slots?.length) {
    return NextResponse.json(
      { error: "Missing required fields (name, slots)" },
      { status: 400 }
    );
  }

  // Validate slots structure
  for (const slot of slots) {
    if (!slot.day || !slot.startTime || !slot.endTime) {
      return NextResponse.json(
        { error: "Each slot must have day, startTime, and endTime" },
        { status: 400 }
      );
    }
  }

  await connectDB();

  const subject = await Subject.create({
    userId: session.user.id,
    name,
    schedules: [
      {
        slots,
        effectiveFrom: new Date(),
        effectiveTo: null,
      },
    ],
    color: color || "#805af2",
    isActive: true,
  });

  return NextResponse.json({ subject }, { status: 201 });
}
