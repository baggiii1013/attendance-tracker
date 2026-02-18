import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import User from "@/lib/db/models/User";
import { NextRequest, NextResponse } from "next/server";

// GET /api/user/settings — get user settings
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(session.user.id)
    .select("maxSessionsPerDay")
    .lean();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    maxSessionsPerDay: user.maxSessionsPerDay ?? 8,
  });
}

// PATCH /api/user/settings — update user settings
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { maxSessionsPerDay } = body;

  if (
    maxSessionsPerDay !== undefined &&
    (typeof maxSessionsPerDay !== "number" ||
      maxSessionsPerDay < 1 ||
      maxSessionsPerDay > 15)
  ) {
    return NextResponse.json(
      { error: "maxSessionsPerDay must be a number between 1 and 15" },
      { status: 400 }
    );
  }

  await connectDB();
  const updates: Record<string, any> = {};
  if (maxSessionsPerDay !== undefined) {
    updates.maxSessionsPerDay = maxSessionsPerDay;
  }

  const user = await User.findByIdAndUpdate(session.user.id, updates, {
    new: true,
  })
    .select("maxSessionsPerDay")
    .lean();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    maxSessionsPerDay: user.maxSessionsPerDay,
  });
}
