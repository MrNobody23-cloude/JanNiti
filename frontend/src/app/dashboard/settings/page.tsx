"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Settings,
  User,
  Shield,
  Bell,
  Globe,
  Database,
  Key,
  Monitor,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
            <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Platform configuration, security, and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <Card className="animate-slide-up">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-primary-500" />
            <CardTitle>Appearance</CardTitle>
          </div>
        </CardHeader>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Theme</p>
            <p className="text-xs text-[var(--text-tertiary)]">Switch between light and dark mode</p>
          </div>
          <Button variant="secondary" size="sm" onClick={toggleTheme}>
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </Button>
        </div>
      </Card>

      {/* Security */}
      <Card className="animate-slide-up" style={{ animationDelay: "50ms" }}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-500" />
            <CardTitle>Security & Access</CardTitle>
          </div>
        </CardHeader>
        <div className="space-y-4">
          {[
            { label: "Role-Based Access Control (RBAC)", status: "Active", variant: "success" as const },
            { label: "End-to-End Encryption", status: "Enabled", variant: "success" as const },
            { label: "Audit Logging", status: "Active", variant: "success" as const },
            { label: "Two-Factor Authentication", status: "Available", variant: "info" as const },
            { label: "API Key Management", status: "3 Active Keys", variant: "info" as const },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-[var(--border-primary)] last:border-0">
              <span className="text-sm text-[var(--text-primary)]">{item.label}</span>
              <Badge variant={item.variant} size="sm">{item.status}</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Notifications */}
      <Card className="animate-slide-up" style={{ animationDelay: "100ms" }}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-500" />
            <CardTitle>Notifications</CardTitle>
          </div>
        </CardHeader>
        <div className="space-y-3">
          {[
            { label: "AI Hotspot Alerts", enabled: true },
            { label: "Project Milestone Updates", enabled: true },
            { label: "Budget Alerts", enabled: true },
            { label: "New Submission Digest", enabled: false },
            { label: "Scheme Match Notifications", enabled: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2">
              <span className="text-sm text-[var(--text-primary)]">{item.label}</span>
              <button
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  item.enabled ? "bg-primary-600" : "bg-[var(--bg-tertiary)]"
                }`}
                aria-label={`Toggle ${item.label}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    item.enabled ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* System Info */}
      <Card className="animate-slide-up" style={{ animationDelay: "150ms" }}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-500" />
            <CardTitle>System Information</CardTitle>
          </div>
        </CardHeader>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Platform Version", value: "2.1.0" },
            { label: "AI Engine", value: "Vertex AI + Gemini" },
            { label: "Database", value: "PostgreSQL + PostGIS" },
            { label: "Translation", value: "Gemini 2.5 Flash" },
            { label: "Last Backup", value: "2 hours ago" },
            { label: "API Status", value: "All systems operational" },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-[var(--text-tertiary)]">{item.label}</p>
              <p className="text-sm font-medium text-[var(--text-primary)] mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
