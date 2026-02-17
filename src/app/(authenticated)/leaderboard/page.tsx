"use client";

import AcrylicBlock from "@/components/ui/AcrylicBlock";
import GlassPanel from "@/components/ui/GlassPanel";
import { MaterialIcon } from "@/components/ui/Icons";
import { useEffect, useState } from "react";

type Metric = "streak" | "xp" | "attendance";

interface LeaderboardEntry {
  _id: string;
  name: string;
  image?: string;
  currentStreak: number;
  xp: number;
  attendancePercentage: number;
  rank: number;
  isCurrentUser: boolean;
}

const metricTabs: { key: Metric; label: string; icon: string }[] = [
  { key: "streak", label: "Streak", icon: "local_fire_department" },
  { key: "xp", label: "XP", icon: "star" },
  { key: "attendance", label: "Attend %", icon: "verified" },
];

function getMetricValue(entry: LeaderboardEntry, metric: Metric): string {
  switch (metric) {
    case "streak":
      return `${entry.currentStreak}d`;
    case "xp":
      return entry.xp.toLocaleString();
    case "attendance":
      return `${entry.attendancePercentage}%`;
  }
}

function getRankStyle(rank: number) {
  switch (rank) {
    case 1:
      return {
        bg: "from-amber-400/20 to-yellow-600/10",
        border: "border-amber-400/40",
        medal: "🥇",
        glow: "shadow-[0_0_20px_rgba(245,158,11,0.3)]",
      };
    case 2:
      return {
        bg: "from-gray-300/15 to-gray-400/10",
        border: "border-gray-400/30",
        medal: "🥈",
        glow: "shadow-[0_0_15px_rgba(156,163,175,0.2)]",
      };
    case 3:
      return {
        bg: "from-amber-700/15 to-orange-800/10",
        border: "border-amber-700/30",
        medal: "🥉",
        glow: "shadow-[0_0_15px_rgba(180,83,9,0.2)]",
      };
    default:
      return {
        bg: "",
        border: "border-white/5",
        medal: "",
        glow: "",
      };
  }
}

export default function LeaderboardPage() {
  const [metric, setMetric] = useState<Metric>("streak");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?metric=${metric}`);
        if (res.ok) {
          const data = await res.json();
          setEntries(data.entries);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [metric]);

  return (
    <div className="min-h-screen bg-void-gradient pb-28 md:px-4">
      {/* Header */}
      <header className="brushed-steel-panel mx-4 mt-4 mb-4 p-5 rounded-2xl relative">
        <div className="screw-head absolute top-3 left-3" />
        <div className="screw-head absolute top-3 right-3" />
        <h1 className="chrome-text text-xl font-bold tracking-wider text-center">
          Leaderboard
        </h1>
        <p className="text-center text-white/30 text-xs font-mono mt-1">
          SYS.RANKING // GLOBAL
        </p>
      </header>

      {/* Metric Tabs */}
      <div className="flex mx-4 mb-6 bg-[#1a1825]/80 rounded-2xl border border-white/5 p-1.5">
        {metricTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMetric(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-all ${
              metric === tab.key
                ? "bg-gradient-to-b from-[#805af2]/30 to-[#805af2]/10 text-[#b794ff] shadow-[0_0_15px_rgba(128,90,242,0.3)] border border-[#805af2]/30"
                : "text-white/30 hover:text-white/50"
            }`}
          >
            <MaterialIcon name={tab.icon} size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Entries list */}
      <div className="mx-4 space-y-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-2 border-[#805af2]/30 border-t-[#805af2] rounded-full animate-spin" />
            <span className="text-white/30 text-xs font-mono mt-4">
              SCANNING RECORDS...
            </span>
          </div>
        ) : entries.length === 0 ? (
          <GlassPanel className="p-8 text-center">
            <MaterialIcon name="group_off" size={48} className="text-white/20 mb-3" />
            <p className="text-white/40 text-sm">No rankings yet.</p>
            <p className="text-white/20 text-xs font-mono mt-1">
              Start tracking to appear on the board
            </p>
          </GlassPanel>
        ) : (
          entries.map((entry) => {
            const rankStyle = getRankStyle(entry.rank);
            return (
              <div
                key={entry._id}
                className={`relative flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                  rankStyle.border
                } ${rankStyle.glow} ${
                  entry.isCurrentUser
                    ? "bg-gradient-to-r from-[#805af2]/15 to-transparent ring-1 ring-[#805af2]/20"
                    : `bg-gradient-to-r ${rankStyle.bg || "from-white/[0.03] to-transparent"}`
                }`}
              >
                {/* Rank */}
                <div className="w-10 text-center shrink-0">
                  {rankStyle.medal ? (
                    <span className="text-2xl">{rankStyle.medal}</span>
                  ) : (
                    <span className="text-white/30 font-mono font-bold text-lg">
                      {entry.rank}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-[#1a1825] shrink-0">
                  {entry.image ? (
                    <img
                      src={entry.image}
                      alt={entry.name || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30 font-bold text-sm">
                      {(entry.name || "?")[0]?.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold truncate ${
                      entry.isCurrentUser ? "text-[#b794ff]" : "text-white/80"
                    }`}
                  >
                    {entry.name || "Anonymous"}
                    {entry.isCurrentUser && (
                      <span className="ml-2 text-[10px] font-mono text-[#805af2]/60 uppercase">
                        (you)
                      </span>
                    )}
                  </p>
                </div>

                {/* Metric Value */}
                <div className="text-right shrink-0">
                  <span className="text-lg font-bold font-mono text-white">
                    {getMetricValue(entry, metric)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
