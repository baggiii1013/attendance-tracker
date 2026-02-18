"use client";

import AcrylicBlock from "@/components/ui/AcrylicBlock";
import BrushedSteelHeader from "@/components/ui/BrushedSteelHeader";
import GlassPanel from "@/components/ui/GlassPanel";
import { GlassIconButton, MaterialIcon } from "@/components/ui/Icons";
import LedStrip from "@/components/ui/LedStrip";
import { format, subMonths } from "date-fns";
import { useCallback, useEffect, useState } from "react";

interface UserDetail {
  _id: string;
  name: string;
  email: string;
  image: string;
  role: string;
  isDisabled: boolean;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  totalAttendanceDays: number;
  totalScheduledDays: number;
  createdAt: string;
}

interface SubjectInfo {
  _id: string;
  name: string;
  color: string;
  isActive: boolean;
}

interface Stats {
  totalAttendanceRecords: number;
  totalFocusSessions: number;
  totalFocusMinutes: number;
  totalSubjects: number;
  activeSubjects: number;
}

interface AttendanceRecord {
  _id: string;
  date: string;
  status: "present" | "absent" | "late";
  xpEarned: number;
  subjectId: {
    _id: string;
    name: string;
    color: string;
  } | string;
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    present: "bg-green-500",
    absent: "bg-red-500",
    late: "bg-yellow-500",
  };
  return <span className={`w-2 h-2 rounded-full ${colors[status] || colors.absent}`} />;
}

export default function UserDetailClient({ userId }: { userId: string }) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [viewMonth, setViewMonth] = useState(new Date());

  const fetchUserDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setSubjects(data.subjects);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch user:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchAttendance = useCallback(async () => {
    setRecordsLoading(true);
    try {
      const m = viewMonth.getMonth();
      const y = viewMonth.getFullYear();
      const res = await fetch(`/api/admin/users/${userId}/attendance?month=${m}&year=${y}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records);
      }
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
    } finally {
      setRecordsLoading(false);
    }
  }, [userId, viewMonth]);

  useEffect(() => {
    fetchUserDetail();
  }, [fetchUserDetail]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm("Delete this attendance record? XP will be reversed.")) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}/attendance/${recordId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRecords((prev) => prev.filter((r) => r._id !== recordId));
        fetchUserDetail(); // Refresh stats
      }
    } catch (err) {
      console.error("Failed to delete record:", err);
    }
  };

  const attendanceRate =
    user && user.totalScheduledDays > 0
      ? Math.round((user.totalAttendanceDays / user.totalScheduledDays) * 100)
      : 0;

  if (loading) {
    return (
      <>
        <BrushedSteelHeader>
          <div className="flex items-center justify-between w-full">
            <GlassIconButton icon="arrow_back" href="/admin" ariaLabel="Back" />
            <span className="text-lg font-bold text-gray-200 font-mono">Loading...</span>
            <div className="w-10" />
          </div>
        </BrushedSteelHeader>
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-gray-700 border-t-[#805af2] animate-spin" />
        </main>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <BrushedSteelHeader>
          <div className="flex items-center justify-between w-full">
            <GlassIconButton icon="arrow_back" href="/admin" ariaLabel="Back" />
            <span className="text-lg font-bold text-red-400 font-mono">User Not Found</span>
            <div className="w-10" />
          </div>
        </BrushedSteelHeader>
      </>
    );
  }

  return (
    <>
      <BrushedSteelHeader>
        <div className="flex items-center justify-between w-full">
          <GlassIconButton icon="arrow_back" href="/admin" ariaLabel="Back" />
          <div className="flex flex-col items-center">
            <h1 className="text-[10px] font-mono etched-text uppercase tracking-[0.2em]">
              USER_DETAIL
            </h1>
            <span className="text-sm font-bold text-gray-200 tracking-tight font-mono truncate max-w-[200px]">
              {user.name.toUpperCase()}
            </span>
          </div>
          <div className="w-10" />
        </div>
      </BrushedSteelHeader>

      <main className="flex-1 overflow-y-auto px-4 md:px-8 pb-28 pt-6 no-scrollbar bg-[#0d0d0f]">
        {/* User Profile Card */}
        <GlassPanel className="p-4 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 ring-2 ring-white/10">
              {user.image ? (
                <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <MaterialIcon name="person" size={28} className="text-gray-600" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base font-mono font-bold text-gray-200 truncate">
                  {user.name}
                </span>
                {user.role === "admin" && (
                  <span className="text-[8px] font-mono uppercase tracking-wider bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded">
                    Admin
                  </span>
                )}
              </div>
              <span className="text-[11px] font-mono text-gray-500 block truncate">{user.email}</span>
              <span className="text-[9px] font-mono text-gray-600 block mt-1">
                Joined {format(new Date(user.createdAt), "MMM d, yyyy")}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: "bolt", color: "text-yellow-500", value: user.xp, label: "XP" },
              { icon: "local_fire_department", color: "text-orange-500", value: user.currentStreak, label: "Streak" },
              { icon: "check_circle", color: "text-green-500", value: `${attendanceRate}%`, label: "Rate" },
              { icon: "timer", color: "text-blue-400", value: stats?.totalFocusMinutes || 0, label: "Focus(m)" },
            ].map((stat) => (
              <AcrylicBlock key={stat.label} className="p-2 flex flex-col items-center">
                <MaterialIcon name={stat.icon} filled size={14} className={`${stat.color} mb-0.5`} />
                <span className="text-sm font-mono font-bold text-white">{stat.value}</span>
                <span className="text-[7px] font-mono uppercase tracking-widest text-gray-600">{stat.label}</span>
              </AcrylicBlock>
            ))}
          </div>
        </GlassPanel>

        {/* Subjects */}
        {subjects.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center mb-3 px-1 border-b border-[#222] pb-2">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 font-mono flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-600 rounded-full" />
                Subjects ({subjects.length})
              </h2>
            </div>
            <div className="flex gap-2 flex-wrap">
              {subjects.map((s) => (
                <span
                  key={s._id}
                  className={`text-[10px] font-mono px-2.5 py-1 rounded-lg ${
                    s.isActive ? "text-gray-300" : "text-gray-600 line-through"
                  }`}
                  style={{
                    backgroundColor: `${s.color}15`,
                    borderLeft: `2px solid ${s.color}`,
                  }}
                >
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Attendance Records */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1 border-b border-[#222] pb-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 font-mono flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-600 rounded-full" />
              Attendance
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMonth((d) => subMonths(d, 1))}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <MaterialIcon name="chevron_left" size={18} />
              </button>
              <span className="text-[10px] font-mono text-gray-400 min-w-[80px] text-center">
                {format(viewMonth, "MMM yyyy").toUpperCase()}
              </span>
              <button
                onClick={() => setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <MaterialIcon name="chevron_right" size={18} />
              </button>
            </div>
          </div>

          {recordsLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 rounded-full border-2 border-gray-700 border-t-[#805af2] animate-spin" />
            </div>
          ) : records.length > 0 ? (
            <div className="space-y-2">
              {records.map((record) => {
                const subject = typeof record.subjectId === "object" ? record.subjectId : null;
                return (
                  <AcrylicBlock
                    key={record._id}
                    className="p-3"
                    borderColor={subject?.color}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <StatusDot status={record.status} />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-mono text-gray-200 truncate">
                            {subject?.name || "Unknown"}
                          </span>
                          <span className="text-[9px] font-mono text-gray-600">
                            {format(new Date(record.date), "EEE, MMM d")} · {record.status.toUpperCase()}
                            {record.xpEarned > 0 && ` · +${record.xpEarned} XP`}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteRecord(record._id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                      >
                        <MaterialIcon name="delete_outline" size={16} />
                      </button>
                    </div>
                  </AcrylicBlock>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <MaterialIcon name="event_busy" size={32} className="text-gray-700" />
              <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                No records this month
              </span>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
