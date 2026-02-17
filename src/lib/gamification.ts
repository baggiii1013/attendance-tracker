import { connectDB } from "@/lib/db/connection";
import User, { IUser } from "@/lib/db/models/User";

// XP Award Constants
export const XP_ATTENDANCE_MARK = 10;
export const XP_FOCUS_SESSION = 5;
export const XP_STREAK_7 = 20;
export const XP_STREAK_30 = 50;
export const XP_STREAK_100 = 100;

export async function awardXP(userId: string, amount: number): Promise<IUser | null> {
  await connectDB();
  return User.findByIdAndUpdate(
    userId,
    { $inc: { xp: amount } },
    { new: true }
  );
}

export function getStreakBonus(streak: number): number {
  if (streak === 100) return XP_STREAK_100;
  if (streak === 30) return XP_STREAK_30;
  if (streak === 7) return XP_STREAK_7;
  return 0;
}

export function calculateAttendancePercentage(
  totalAttendanceDays: number,
  totalScheduledDays: number
): number {
  if (totalScheduledDays === 0) return 0;
  return Math.round((totalAttendanceDays / totalScheduledDays) * 100);
}
