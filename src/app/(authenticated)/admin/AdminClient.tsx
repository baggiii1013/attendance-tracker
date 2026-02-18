"use client";

import AcrylicBlock from "@/components/ui/AcrylicBlock";
import BrushedSteelHeader from "@/components/ui/BrushedSteelHeader";
import GlassPanel from "@/components/ui/GlassPanel";
import { GlassIconButton, MaterialIcon } from "@/components/ui/Icons";
import { useCallback, useEffect, useState } from "react";

interface UserSummary {
  _id: string;
  name: string;
  email: string;
  image: string;
  role: string;
  isDisabled: boolean;
  xp: number;
  currentStreak: number;
  totalAttendanceDays: number;
  totalScheduledDays: number;
  subjectCount: number;
  recentAttendance: number;
  createdAt: string;
}

interface UsersResponse {
  users: UserSummary[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AdminClient() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", page.toString());
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleDisable = async (userId: string, currentlyDisabled: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDisabled: !currentlyDisabled }),
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error("Failed to update user:", err);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Delete user "${userName}" and ALL their data? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  return (
    <>
      <BrushedSteelHeader>
        <div className="flex items-center justify-between w-full">
          <GlassIconButton icon="arrow_back" href="/dashboard" ariaLabel="Back" />
          <div className="flex flex-col items-center">
            <h1 className="text-[10px] font-mono etched-text uppercase tracking-[0.2em]">
              ADMIN_PANEL
            </h1>
            <span className="text-lg font-bold text-gray-200 tracking-tight font-mono">
              USER MANAGEMENT
            </span>
          </div>
          <div className="w-10" />
        </div>
      </BrushedSteelHeader>

      <main className="flex-1 overflow-y-auto px-4 md:px-8 pb-28 pt-6 no-scrollbar bg-[#0d0d0f]">
        {/* Stats Summary */}
        {data && (
          <div className="flex gap-3 mb-6 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
            <AcrylicBlock className="p-3 flex flex-col items-center min-w-[80px] shrink-0">
              <MaterialIcon name="group" size={18} className="text-blue-400 mb-1" />
              <span className="text-lg font-mono font-bold text-white leading-none">
                {data.total}
              </span>
              <span className="text-[8px] font-mono uppercase tracking-widest text-gray-500 mt-1">
                Users
              </span>
            </AcrylicBlock>
            <AcrylicBlock className="p-3 flex flex-col items-center min-w-[80px] shrink-0">
              <MaterialIcon name="admin_panel_settings" filled size={18} className="text-yellow-500 mb-1" />
              <span className="text-lg font-mono font-bold text-white leading-none">
                {data.users.filter((u) => u.role === "admin").length}
              </span>
              <span className="text-[8px] font-mono uppercase tracking-widest text-gray-500 mt-1">
                Admins
              </span>
            </AcrylicBlock>
            <AcrylicBlock className="p-3 flex flex-col items-center min-w-[80px] shrink-0">
              <MaterialIcon name="block" size={18} className="text-red-500 mb-1" />
              <span className="text-lg font-mono font-bold text-white leading-none">
                {data.users.filter((u) => u.isDisabled).length}
              </span>
              <span className="text-[8px] font-mono uppercase tracking-widest text-gray-500 mt-1">
                Disabled
              </span>
            </AcrylicBlock>
          </div>
        )}

        {/* Search Bar */}
        <GlassPanel className="p-3 mb-4">
          <div className="flex items-center gap-2">
            <MaterialIcon name="search" size={18} className="text-gray-500" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="flex-1 bg-transparent text-sm font-mono text-gray-200 placeholder-gray-600 outline-none"
            />
            {search && (
              <button onClick={() => { setSearch(""); setPage(1); }}>
                <MaterialIcon name="close" size={16} className="text-gray-500 hover:text-white" />
              </button>
            )}
          </div>
        </GlassPanel>

        {/* Users List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-gray-700 border-t-[#805af2] animate-spin" />
            <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
              Loading users...
            </span>
          </div>
        ) : data && data.users.length > 0 ? (
          <div className="space-y-3">
            {data.users.map((user) => (
              <AcrylicBlock
                key={user._id}
                className="p-4"
                borderColor={user.role === "admin" ? "#eab308" : user.isDisabled ? "#ef4444" : "#805af2"}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 ring-1 ring-white/10">
                    {user.image ? (
                      <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <MaterialIcon name="person" size={20} className="text-gray-600" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name & Role */}
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-sm font-mono font-bold truncate ${user.isDisabled ? "text-gray-600 line-through" : "text-gray-200"}`}>
                        {user.name}
                      </span>
                      {user.role === "admin" && (
                        <span className="text-[8px] font-mono uppercase tracking-wider bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded">
                          Admin
                        </span>
                      )}
                      {user.isDisabled && (
                        <span className="text-[8px] font-mono uppercase tracking-wider bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded">
                          Disabled
                        </span>
                      )}
                    </div>

                    {/* Email */}
                    <span className="text-[10px] font-mono text-gray-500 block truncate">
                      {user.email}
                    </span>

                    {/* Stats Row */}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[9px] font-mono text-gray-500 flex items-center gap-1">
                        <MaterialIcon name="bolt" filled size={12} className="text-yellow-500/70" />
                        {user.xp} XP
                      </span>
                      <span className="text-[9px] font-mono text-gray-500 flex items-center gap-1">
                        <MaterialIcon name="local_fire_department" filled size={12} className="text-orange-500/70" />
                        {user.currentStreak}
                      </span>
                      <span className="text-[9px] font-mono text-gray-500 flex items-center gap-1">
                        <MaterialIcon name="school" size={12} className="text-blue-400/70" />
                        {user.subjectCount}
                      </span>
                      <span className="text-[9px] font-mono text-gray-500 flex items-center gap-1">
                        <MaterialIcon name="check_circle" size={12} className="text-green-500/70" />
                        {user.recentAttendance} (30d)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#222]">
                  <a
                    href={`/admin/users/${user._id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg glass-panel text-[10px] font-mono uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
                  >
                    <MaterialIcon name="visibility" size={14} />
                    View
                  </a>
                  <button
                    onClick={() => handleRoleChange(user._id, user.role === "admin" ? "user" : "admin")}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg glass-panel text-[10px] font-mono uppercase tracking-wider text-gray-400 hover:text-yellow-500 transition-colors"
                  >
                    <MaterialIcon name="shield" size={14} />
                    {user.role === "admin" ? "Demote" : "Promote"}
                  </button>
                  <button
                    onClick={() => handleToggleDisable(user._id, user.isDisabled)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg glass-panel text-[10px] font-mono uppercase tracking-wider transition-colors ${
                      user.isDisabled
                        ? "text-gray-400 hover:text-green-500"
                        : "text-gray-400 hover:text-red-500"
                    }`}
                  >
                    <MaterialIcon name={user.isDisabled ? "check_circle" : "block"} size={14} />
                    {user.isDisabled ? "Enable" : "Disable"}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user._id, user.name)}
                    className="flex items-center justify-center w-8 h-8 rounded-lg glass-panel text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <MaterialIcon name="delete" size={16} />
                  </button>
                </div>
              </AcrylicBlock>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <MaterialIcon name="person_off" size={40} className="text-gray-700" />
            <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
              {search ? "No users found" : "No users yet"}
            </span>
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="glass-panel px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-default transition-colors"
            >
              Prev
            </button>
            <span className="text-[10px] font-mono text-gray-500">
              {page} / {data.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page >= data.totalPages}
              className="glass-panel px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-default transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </>
  );
}
