"use client";

import AcrylicBlock from "@/components/ui/AcrylicBlock";
import BrushedSteelHeader from "@/components/ui/BrushedSteelHeader";
import { MaterialIcon } from "@/components/ui/Icons";
import LedStrip from "@/components/ui/LedStrip";
import Image from "next/image";
import Link from "next/link";
import SubjectCard from "./SubjectCard";

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
  subjects: Array<{
    _id: string;
    name: string;
    slots: Array<{ day: string; startTime: string; endTime: string }>;
    displayTime: string;
    color: string;
    isScheduledToday: boolean;
    sessionStatus: "active" | "upcoming" | "completed" | "inactive";
    attendanceMarked: boolean;
    attendanceStatus: string | null;
  }>;
}

export default function DashboardClient({ data }: { data: DashboardData }) {
  const { user, subjects } = data;

  // Generate a display name
  const displayName = user.name?.split(" ")[0]?.toUpperCase() || "OPERATOR";

  // Calculate LED counts
  const healthLeds = Math.round((user.attendancePercent / 100) * 6);
  const xpLevel = Math.min(Math.floor(user.xp / 500), 6);

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

        {/* Active Modules */}
        <div className="flex items-center justify-between mb-4 px-1 border-b border-[#222] pb-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 font-mono flex items-center gap-2">
            <span className="w-2 h-2 bg-gray-600 rounded-full" />
            Active Modules
          </h2>
          <Link
            href="/subjects/new"
            className="text-gray-400 hover:text-white transition-colors text-[10px] font-mono uppercase bg-[#1a1a1a] px-3 py-1 rounded border border-[#333] hover:border-gray-500"
          >
            Configure
          </Link>
        </div>

        {/* Subject Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.length === 0 ? (
            <div className="acrylic-block rounded-xl p-8 text-center">
              <MaterialIcon
                name="widgets"
                size={48}
                className="text-gray-600 mb-4"
              />
              <p className="text-gray-400 font-mono text-sm mb-4">
                No modules configured
              </p>
              <Link
                href="/subjects/new"
                className="text-[#4D79FF] font-mono text-xs uppercase tracking-widest hover:text-white transition-colors"
              >
                + Add First Module
              </Link>
            </div>
          ) : (
            subjects.map((subject) => (
              <SubjectCard key={subject._id} subject={subject} />
            ))
          )}
        </div>

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
