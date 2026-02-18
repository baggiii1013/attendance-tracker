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
    if (!slot.day || typeof slot.sessionNumber !== "number") {
      return NextResponse.json(
        { error: "Each slot must have day and sessionNumber" },
        { status: 400 }
      );
    }
  }

  // Check for duplicate (day, sessionNumber) within the new subject
  const slotKeys = slots.map(
    (s: any) => `${s.day}-${s.sessionNumber}`
  );
  if (new Set(slotKeys).size !== slotKeys.length) {
    return NextResponse.json(
      { error: "Duplicate day+sessionNumber combination in slots" },
      { status: 400 }
    );
  }

  await connectDB();

  // Check for conflicts with existing subjects (same user, same day+session)
  const existingSubjects = await Subject.find({
    userId: session.user.id,
    isActive: true,
  }).lean();

  for (const slot of slots) {
    for (const existing of existingSubjects) {
      const currentSchedule = (existing.schedules || []).find(
        (s: any) => s.effectiveTo === null
      );
      if (!currentSchedule) continue;
      const conflict = currentSchedule.slots.find(
        (s: any) =>
          s.day === slot.day && s.sessionNumber === slot.sessionNumber
      );
      if (conflict) {
        return NextResponse.json(
          {
            error: `Session ${slot.sessionNumber} on ${slot.day} is already assigned to "${existing.name}"`,
          },
          { status: 409 }
        );
      }
    }
  }

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
