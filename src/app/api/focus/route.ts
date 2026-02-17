import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import FocusSession from "@/lib/db/models/FocusSession";
import { awardXP, XP_FOCUS_SESSION } from "@/lib/gamification";
import { NextRequest, NextResponse } from "next/server";

// GET /api/focus — retrieve focus session history
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const period = searchParams.get("period") || "today"; // today | week | all

  let dateFilter = {};
  const now = new Date();

  if (period === "today") {
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    dateFilter = { completedAt: { $gte: startOfDay } };
  } else if (period === "week") {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);
    dateFilter = { completedAt: { $gte: startOfWeek } };
  }

  const sessions = await FocusSession.find({
    userId: session.user.id,
    ...dateFilter,
  })
    .sort({ completedAt: -1 })
    .limit(limit)
    .lean();

  // Calculate stats
  const totalSessions = sessions.filter((s) => s.completed).length;
  const totalMinutes = sessions
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalXP = sessions.reduce((sum, s) => sum + (s.xpEarned || 0), 0);

  return NextResponse.json({
    sessions,
    stats: { totalSessions, totalMinutes, totalXP },
  });
}

// POST /api/focus — log a completed focus session
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { duration, completed, subjectId } = body;

  if (duration === undefined || completed === undefined) {
    return NextResponse.json({ error: "Missing duration or completed" }, { status: 400 });
  }

  await connectDB();

  const xpEarned = completed ? XP_FOCUS_SESSION : 0;

  const focusSession = await FocusSession.create({
    userId: session.user.id,
    subjectId: subjectId || null,
    duration,
    completed,
    completedAt: new Date(),
    xpEarned,
  });

  if (completed) {
    await awardXP(session.user.id, xpEarned);
  }

  return NextResponse.json({ focusSession }, { status: 201 });
}
