import { connectDB } from "@/lib/db/connection";
import User from "@/lib/db/models/User";
import { awardXP, getStreakBonus } from "@/lib/gamification";

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isYesterday(d1: Date, d2: Date): boolean {
  const yesterday = new Date(d2);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(d1, yesterday);
}

export async function updateStreak(userId: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  streakBonus: number;
}> {
  await connectDB();
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let newStreak = user.currentStreak;
  let streakBonus = 0;

  if (user.lastAttendanceDate) {
    const lastDate = new Date(user.lastAttendanceDate);
    lastDate.setHours(0, 0, 0, 0);

    if (isSameDay(lastDate, today)) {
      // Already marked today, no streak change
      return {
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        streakBonus: 0,
      };
    } else if (isYesterday(lastDate, today)) {
      // Consecutive day — increment streak
      newStreak = user.currentStreak + 1;
    } else {
      // Gap detected — reset streak
      newStreak = 1;
    }
  } else {
    // First ever attendance
    newStreak = 1;
  }

  const newLongestStreak = Math.max(user.longestStreak, newStreak);
  streakBonus = getStreakBonus(newStreak);

  if (streakBonus > 0) {
    await awardXP(userId, streakBonus);
  }

  await User.findByIdAndUpdate(userId, {
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    lastAttendanceDate: today,
    $inc: {
      totalAttendanceDays: 1,
    },
  });

  return {
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    streakBonus,
  };
}
