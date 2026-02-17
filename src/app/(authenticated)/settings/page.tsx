"use client";

import AcrylicBlock from "@/components/ui/AcrylicBlock";
import ClayButton from "@/components/ui/ClayButton";
import GlassPanel from "@/components/ui/GlassPanel";
import { GlassIconButton, MaterialIcon } from "@/components/ui/Icons";
import MetalButton from "@/components/ui/MetalButton";
import { signOut } from "next-auth/react";
import { useState } from "react";

export default function SettingsPage() {
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-void-gradient pb-28 md:px-4">
      {/* Header */}
      <header className="brushed-steel-panel mx-4 mt-4 mb-6 p-5 rounded-2xl relative">
        <div className="screw-head absolute top-3 left-3" />
        <div className="screw-head absolute top-3 right-3" />
        <h1 className="chrome-text text-xl font-bold tracking-wider text-center">
          Settings
        </h1>
        <p className="text-center text-white/30 text-xs font-mono mt-1">
          SYS.CONFIG // PREFERENCES
        </p>
      </header>

      <div className="mx-4 space-y-4">
        {/* About Section */}
        <GlassPanel className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <MaterialIcon
              name="info"
              size={20}
              className="text-[#805af2]/60"
            />
            <h2 className="text-sm font-bold tracking-wider uppercase text-white/60">
              About
            </h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-white/30">VERSION</span>
              <span className="text-sm font-mono text-white/70">1.0.0</span>
            </div>
            <div className="w-full h-px bg-white/5" />
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-white/30">SYSTEM</span>
              <span className="text-sm font-mono text-white/70">
                Glass & Steel UI
              </span>
            </div>
            <div className="w-full h-px bg-white/5" />
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-white/30">ENGINE</span>
              <span className="text-sm font-mono text-white/70">
                Next.js + Mongoose
              </span>
            </div>
          </div>
        </GlassPanel>

        {/* Data Section */}
        <GlassPanel className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <MaterialIcon
              name="storage"
              size={20}
              className="text-[#4D79FF]/60"
            />
            <h2 className="text-sm font-bold tracking-wider uppercase text-white/60">
              Data
            </h2>
          </div>
          <p className="text-xs text-white/30 mb-4">
            Your attendance data is stored securely and can be accessed from any
            device where you sign in with the same Google account.
          </p>
          <AcrylicBlock borderColor="#4D79FF" className="p-3 flex items-center gap-3">
            <MaterialIcon name="cloud_done" size={20} className="text-[#4D79FF]/80" />
            <span className="text-xs font-mono text-white/50">
              All data synced to cloud
            </span>
          </AcrylicBlock>
        </GlassPanel>

        {/* Account Section */}
        <GlassPanel className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <MaterialIcon
              name="account_circle"
              size={20}
              className="text-[#FF4D4D]/60"
            />
            <h2 className="text-sm font-bold tracking-wider uppercase text-white/60">
              Account
            </h2>
          </div>

          <ClayButton
            variant="coral"
            onClick={handleSignOut}
            className="w-full"
          >
            {signingOut ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing Out...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <MaterialIcon name="logout" size={18} />
                Sign Out
              </span>
            )}
          </ClayButton>
        </GlassPanel>
      </div>
    </div>
  );
}
