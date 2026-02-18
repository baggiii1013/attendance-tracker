import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import AttendanceRecord from "@/lib/db/models/AttendanceRecord";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/users/[id]/attendance — get user's attendance records
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { id } = await params;
  const monthParam = req.nextUrl.searchParams.get("month");
  const yearParam = req.nextUrl.searchParams.get("year");

  await connectDB();

  let dateFilter: any = {};
  if (monthParam && yearParam) {
    const month = parseInt(monthParam, 10);
    const year = parseInt(yearParam, 10);
    const target = new Date(year, month, 1);
    dateFilter = {
      $gte: startOfMonth(target),
      $lte: endOfMonth(target),
    };
  }

  const filter: any = { userId: id };
  if (dateFilter.$gte) {
    filter.date = dateFilter;
  }

  const records = await AttendanceRecord.find(filter)
    .populate("subjectId", "name color schedules")
    .sort({ date: -1 })
    .lean();

  return NextResponse.json({
    records: records.map((r) => ({
      ...r,
      _id: r._id.toString(),
      date: format(new Date(r.date), "yyyy-MM-dd"),
    })),
  });
}
