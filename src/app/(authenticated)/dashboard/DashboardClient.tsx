"use client";

import AcrylicBlock from "@/components/ui/AcrylicBlock";
import BrushedSteelHeader from "@/components/ui/BrushedSteelHeader";
import { MaterialIcon } from "@/components/ui/Icons";
import LedStrip from "@/components/ui/LedStrip";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import SessionSlotCard from "./SubjectCard";

interface SessionSlot {
  sessionNumber: number;
  subject: {
    _id: string;
    name: string;
    color: string;
    startTime?: string;
    endTime?: string;
  } | null;
  attendanceMarked: boolean;
  attendanceStatus: string | null;
}

interface SubjectInfo {
  _id: string;
  name: string;
  color: string;
  isScheduledToday: boolean;
  totalSlots: number;
}

interface DashboardData {
  user: {
    _id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
    xp: number;
    currentStreak: number;
    longestStreak: number;
    totalAttendanceDays: number;
    attendancePercent: number;
  };
  sessions: SessionSlot[];
  subjects: SubjectInfo[];
  maxSessionsPerDay: number;
}

export default function DashboardClient({ data }: { data: DashboardData }) {
  const { user, sessions, subjects } = data;

  // Generate a display name
  const displayName = user.name?.split(" ")[0]?.toUpperCase() || "OPERATOR";

  // Calculate LED counts
  const healthLeds = Math.round((user.attendancePercent / 100) * 6);
  const xpLevel = Math.min(Math.floor(user.xp / 500), 6);

  // Count today's stats
  const scheduledSessions = sessions.filter((s) => s.subject !== null);
  const markedSessions = sessions.filter(
    (s) => s.subject !== null && s.attendanceMarked
  );
  const freeSessions = sessions.filter((s) => s.subject === null);

  return (
    <>
      {/* Header */}
      <BrushedSteelHeader>
        <div className="flex items-center gap-5 w-full">
          {/* Avatar */}
          <div className="relative group shrink-0">
            <div className="relative w-16 h-16 rounded-full bg-[#111] flex items-center justify-center border-2 border-[#333] shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)] overflow-hidden">
              {user.image ? (
                <Image
                  src={user.image}
                  alt="Avatar"
                  width={48}
                  height={48}
                  className="w-12 h-12 object-cover opacity-80 mix-blend-screen rounded-full"
                />
              ) : (
                <MaterialIcon
                  name="person"
                  size={32}
                  className="text-gray-500"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#111] rounded-full p-1 border border-[#333]">
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-led-green animate-pulse" />
            </div>
          </div>

          {/* User Info */}
          <div className="flex flex-col flex-1">
            <div className="flex justify-between items-baseline border-b border-[#333] pb-1 mb-1">
              <h1 className="text-[10px] font-mono etched-text uppercase tracking-[0.2em]">
                OPERATOR_ID
              </h1>
              <span className="text-[10px] font-mono text-green-500 tracking-widest">
                ONLINE
              </span>
            </div>
            <div className="text-xl font-bold text-gray-200 tracking-tight font-mono">
              {displayName}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="h-2 flex-1 bg-[#111] rounded-sm overflow-hidden border border-[#333] relative">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_19%,rgba(0,0,0,0.8)_20%)] bg-[length:4px_100%] z-10" />
                <div
                  className="h-full bg-gradient-to-r from-blue-900 via-blue-600 to-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)] relative z-0 transition-all duration-500"
                  style={{
                    width: `${Math.min((user.xp / 2000) * 100, 100)}%`,
                  }}
                />
              </div>
              <span className="text-[10px] font-mono text-blue-400">
                {user.xp} XP
              </span>
            </div>
          </div>

          {/* Streak Counter */}
          <div className="bg-[#1a1a1a] rounded border border-[#333] p-2 flex flex-col items-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
            <MaterialIcon
              name="local_fire_department"
              filled
              size={18}
              className="text-orange-600 drop-shadow-[0_0_5px_rgba(234,88,12,0.4)]"
            />
            <span className="text-[10px] font-bold font-mono text-gray-400 mt-1">
              {user.currentStreak}d
            </span>
          </div>
        </div>
      </BrushedSteelHeader>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 pb-28 pt-6 no-scrollbar bg-[#0d0d0f]">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <AcrylicBlock className="p-4 flex flex-col justify-between h-24">
            <div className="flex justify-between items-start z-10">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                SYS.HEALTH
              </span>
              <MaterialIcon
                name="ecg_heart"
                size={14}
                className="text-green-500 drop-shadow-led-green"
              />
            </div>
            <div className="z-10">
              <div className="text-2xl font-mono font-bold text-white mb-1">
                {user.attendancePercent}
                <span className="text-sm text-gray-600">%</span>
              </div>
              <LedStrip total={6} active={healthLeds} color="green" />
            </div>
          </AcrylicBlock>

          <AcrylicBlock className="p-4 flex flex-col justify-between h-24">
            <div className="flex justify-between items-start z-10">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                SYS.MANA
              </span>
              <MaterialIcon
                name="bolt"
                size={14}
                className="text-blue-500 drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]"
              />
            </div>
            <div className="z-10">
              <div className="text-2xl font-mono font-bold text-white mb-1">
                {user.xp}
              </div>
              <LedStrip total={6} active={xpLevel} color="yellow" />
            </div>
          </AcrylicBlock>
        </div>

        {/* Today's Session Summary */}
        <div className="flex items-center gap-4 mb-4 px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[10px] font-mono text-gray-500">
              {markedSessions.length}/{scheduledSessions.length} MARKED
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-gray-600" />
            <span className="text-[10px] font-mono text-gray-500">
              {freeSessions.length} FREE
            </span>
          </div>
        </div>

        {/* Active Modules Header */}
        <div className="flex items-center justify-between mb-4 px-1 border-b border-[#222] pb-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 font-mono flex items-center gap-2">
            <span className="w-2 h-2 bg-gray-600 rounded-full" />
            Today&apos;s Sessions
          </h2>
          <Link
            href="/subjects/new"
            className="text-gray-400 hover:text-white transition-colors text-[10px] font-mono uppercase bg-[#1a1a1a] px-3 py-1 rounded border border-[#333] hover:border-gray-500"
          >
            + Module
          </Link>
        </div>

        {/* Session Grid */}
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <div className="acrylic-block rounded-xl p-8 text-center">
              <MaterialIcon
                name="widgets"
                size={48}
                className="text-gray-600 mb-4"
              />
              <p className="text-gray-400 font-mono text-sm mb-4">
                No sessions configured
              </p>
              <Link
                href="/settings"
                className="text-[#4D79FF] font-mono text-xs uppercase tracking-widest hover:text-white transition-colors"
              >
                Set Up Sessions
              </Link>
            </div>
          ) : (
            sessions.map((session) => (
              <SessionSlotCard key={session.sessionNumber} session={session} />
            ))
          )}
        </div>

        {/* Subjects Management Section */}
        {subjects.length > 0 && (
          <>
            <div className="flex items-center justify-between mt-10 mb-4 px-1 border-b border-[#222] pb-2">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 font-mono flex items-center gap-2">
                <span className="w-2 h-2 bg-[#805af2] rounded-full" />
                All Modules
              </h2>
            </div>

            <div className="space-y-2">
              {subjects.map((subject) => (
                <AcrylicBlock
                  key={subject._id}
                  className="p-3"
                  borderColor={subject.color}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{
                          backgroundColor: subject.color,
                          boxShadow: `0 0 6px ${subject.color}40`,
                        }}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-mono text-gray-200 truncate">
                          {subject.name}
                        </span>
                        <span className="text-[9px] font-mono text-gray-600">
                          {subject.totalSlots} slot
                          {subject.totalSlots !== 1 ? "s" : ""} configured
                          {subject.isScheduledToday && (
                            <span className="text-green-500 ml-2">
                              ● TODAY
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/subjects/${subject._id}/edit`}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-gray-500 hover:text-[#4D79FF] hover:border-[#4D79FF]/30 transition-colors"
                      >
                        <MaterialIcon name="edit" size={16} />
                      </Link>
                      <DeleteSubjectButton
                        subjectId={subject._id}
                        subjectName={subject.name}
                      />
                    </div>
                  </div>
                </AcrylicBlock>
              ))}
            </div>
          </>
        )}

        {/* Add Button */}
        <div className="mt-8 flex justify-center pb-8">
          <Link
            href="/subjects/new"
            className="group relative w-16 h-16 rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#e0e0e0] via-[#888] to-[#444] border border-white/20" />
            <div className="absolute inset-[3px] rounded-full bg-[#1a1a1a] shadow-inner flex items-center justify-center">
              <MaterialIcon
                name="add"
                size={24}
                className="text-gray-400 group-hover:text-white transition-colors"
              />
            </div>
          </Link>
        </div>
      </main>
    </>
  );
}

function DeleteSubjectButton({
  subjectId,
  subjectName,
}: {
  subjectId: string;
  subjectName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/subjects/${subjectId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to delete subject:", err);
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-[9px] font-mono text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/30 hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          {deleting ? "..." : "YES"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-[9px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded border border-white/10 hover:bg-white/10 transition-colors"
        >
          NO
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-gray-500 hover:text-red-400 hover:border-red-400/30 transition-colors"
      title={`Delete ${subjectName}`}
    >
      <MaterialIcon name="delete" size={16} />
    </button>
  );
}
