"use client";

import { cn } from "@/lib/utils";
import {
  Bot,
  Brain,
  Building2,
  ChevronLeft,
  FileText,
  Home,
  Layers3,
  LayoutDashboard,
  MessageSquare,
  Network,
  Settings,
  Target,
  TrendingUp,
  Users,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, section: "main" },
  { href: "/dashboard/submissions", label: "Citizen Voice", icon: MessageSquare, section: "main" },
  { href: "/dashboard/projects", label: "AI Projects", icon: Target, section: "main" },
  { href: "/dashboard/copilot", label: "AI Copilot", icon: Bot, section: "intelligence", badge: "NEW" },
  { href: "/dashboard/priority-engine", label: "Decision Engine", icon: Brain, section: "intelligence" },
  { href: "/dashboard/knowledge-graph", label: "Map Intelligence", icon: Network, section: "intelligence" },
  { href: "/dashboard/digital-twin", label: "Scenario Planner", icon: Layers3, section: "intelligence" },
  { href: "/dashboard/budget", label: "Budget & MPLADS", icon: TrendingUp, section: "operations" },
  { href: "/dashboard/departments", label: "Departments", icon: Building2, section: "operations" },
  { href: "/dashboard/reports", label: "Resolution Proofs", icon: FileText, section: "operations" },
  { href: "/dashboard/citizens", label: "Citizen Portal", icon: Users, section: "portals" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, section: "system" },
];

const sections = [
  { key: "main", label: "Main" },
  { key: "intelligence", label: "AI Intelligence" },
  { key: "operations", label: "Operations" },
  { key: "portals", label: "Portals" },
  { key: "system", label: "System" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-primary-900/20",
        "bg-[var(--bg-sidebar)] text-white transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in overflow-hidden">
            <h1 className="text-sm font-bold tracking-tight">JanNiti AI</h1>
            <p className="text-[10px] text-primary-300">Constituency Intelligence</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 sidebar-scroll">
        {sections.map((section) => {
          const items = navItems.filter((i) => i.section === section.key);
          if (items.length === 0) return null;
          return (
            <div key={section.key} className="mb-4">
              {!collapsed && (
                <p className="mb-2 px-4 text-[10px] font-semibold uppercase tracking-wider text-primary-400">
                  {section.label}
                </p>
              )}
              {items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "mx-2 mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary-600/40 text-white shadow-sm"
                        : "text-primary-200 hover:bg-white/5 hover:text-white",
                      collapsed && "justify-center px-2"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive && "text-primary-300")} />
                    {!collapsed && (
                      <span className="flex-1 truncate">{item.label}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span className="rounded bg-accent-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* AI Status */}
      {!collapsed && (
        <div className="mx-3 mb-3 rounded-lg bg-white/5 p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-medium text-primary-300">AI Engine Active</span>
          </div>
          <div className="text-[10px] text-primary-400">
            <div className="flex justify-between">
              <span>Processed Today</span>
              <span className="text-primary-200">342</span>
            </div>
            <div className="flex justify-between">
              <span>Accuracy</span>
              <span className="text-primary-200">94.7%</span>
            </div>
          </div>
        </div>
      )}

      {/* Collapse */}
      <div className="border-t border-white/10 p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-primary-300 hover:bg-white/5 hover:text-white transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
