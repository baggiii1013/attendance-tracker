"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", icon: "home", label: "Home" },
  { href: "/leaderboard", icon: "bar_chart", label: "Ranks" },
  { href: "/calendar", icon: "calendar_month", label: "Calendar" },
  { href: "/focus", icon: "timer", label: "Focus" },
  { href: "/settings", icon: "settings", label: "Settings" },
];

const adminNavItem = { href: "/admin", icon: "admin_panel_settings", label: "Admin" };

interface BottomNavProps {
  role?: string;
}

export default function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();

  const items = role === "admin" ? [...navItems, adminNavItem] : navItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4 pt-2 md:pb-6">
      <div className="relative w-[90%] max-w-[360px] md:max-w-[480px]">
        {/* Decorative screws - outside flex container */}
        <div className="absolute top-1/2 -left-2 -translate-y-1/2 screw-head" />
        <div className="absolute top-1/2 -right-2 -translate-y-1/2 screw-head" />

        <div className="acrylic-block rounded-2xl px-6 py-4 md:px-8 md:py-5 flex justify-between items-center bg-[#0d0d0f]/90">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-1 group relative"
              >
                {isActive && (
                  <div className="absolute inset-[-8px] bg-white/5 rounded-lg blur-sm" />
                )}
                <span
                  className={`material-symbols-outlined text-xl md:text-2xl transition-colors ${
                    isActive
                      ? "text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]"
                      : "text-gray-600 group-hover:text-gray-300"
                  }`}
                  style={
                    isActive
                      ? { fontVariationSettings: "'FILL' 1" }
                      : undefined
                  }
                >
                  {item.icon}
                </span>
                {/* Label - visible on tablets */}
                <span
                  className={`hidden md:block text-[9px] font-mono tracking-wider ${
                    isActive ? "text-white" : "text-gray-600"
                  }`}
                >
                  {item.label}
                </span>
                <span
                  className={`absolute -bottom-2 w-1 h-1 rounded-full transition-colors ${
                    isActive
                      ? "bg-blue-500 shadow-[0_0_5px_#3b82f6]"
                      : "bg-transparent group-hover:bg-green-500 shadow-led-green"
                  }`}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
