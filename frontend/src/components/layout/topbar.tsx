"use client";

import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { useSession, signOut } from "next-auth/react";
import {
  Bell,
  Globe,
  LogOut,
  Moon,
  Search,
  Sun,
  User,
} from "lucide-react";
import { useState } from "react";

export function Topbar() {
  const { theme, toggleTheme } = useTheme();
  const { data: session } = useSession();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const userName = session?.user?.name ?? "User";
  const userRole = (session?.user as any)?.role ?? "citizen";
  const roleLabel = userRole === "admin" ? "Admin" : userRole === "mp" ? "MP" : "Citizen";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border-primary)] bg-[var(--bg-primary)]/80 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="search"
            placeholder="Search projects, submissions, villages..."
            className="h-9 w-80 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] pl-9 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
            aria-label="Search"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Language */}
        <button
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          aria-label="Change language"
        >
          <Globe className="h-4 w-4" />
          <span>EN</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-96 animate-scale-in rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] shadow-[var(--shadow-lg)]">
                <div className="border-b border-[var(--border-primary)] px-4 py-3">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto p-2">
                  {[
                    { title: "AI Alert: New Hotspot Detected", desc: "Water contamination cluster in Pindra block", time: "2h ago", type: "alert" },
                    { title: "Project Milestone Reached", desc: "Road widening project at 55% completion", time: "5h ago", type: "success" },
                    { title: "Budget Report Ready", desc: "Q3 utilization report available for review", time: "1d ago", type: "info" },
                    { title: "Scheme Match Found", desc: "3 projects eligible for PMKSY co-funding", time: "1d ago", type: "recommendation" },
                  ].map((n, i) => (
                    <div
                      key={i}
                      className="rounded-lg px-3 py-2.5 hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                          n.type === "alert" ? "bg-red-500" :
                          n.type === "success" ? "bg-emerald-500" :
                          n.type === "recommendation" ? "bg-purple-500" : "bg-blue-500"
                        )} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)]">{n.title}</p>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{n.desc}</p>
                          <p className="text-[10px] text-[var(--text-tertiary)] mt-1">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User */}
        <div className="relative ml-2">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 rounded-lg border border-[var(--border-primary)] px-3 py-1.5 hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-accent-500 text-white">
              <User className="h-3.5 w-3.5" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-[var(--text-primary)]">{userName}</p>
              <p className="text-[10px] text-[var(--text-tertiary)]">{roleLabel}, Varanasi</p>
            </div>
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-48 animate-scale-in rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] shadow-[var(--shadow-lg)] p-1">
                <div className="px-3 py-2 border-b border-[var(--border-primary)]">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{userName}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{session?.user?.email}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
