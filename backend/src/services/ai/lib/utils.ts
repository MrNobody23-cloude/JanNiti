import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-IN").format(num);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getSectorColor(sector: string): string {
  const colors: Record<string, string> = {
    education: "#3B82F6",
    healthcare: "#EF4444",
    water_sanitation: "#06B6D4",
    roads_transport: "#8B5CF6",
    agriculture: "#22C55E",
    digital_infra: "#6366F1",
    housing: "#F59E0B",
    energy: "#F97316",
    environment: "#10B981",
    social_welfare: "#EC4899",
    skill_development: "#14B8A6",
    sports_culture: "#A855F7",
  };
  return colors[sector] || "#6B7280";
}

export function getSectorLabel(sector: string): string {
  const labels: Record<string, string> = {
    education: "Education",
    healthcare: "Healthcare",
    water_sanitation: "Water & Sanitation",
    roads_transport: "Roads & Transport",
    agriculture: "Agriculture",
    energy_digital: "Energy & Digital",
    housing: "Housing",
    environment: "Environment",
    social_welfare: "Social Welfare",
    skill_youth: "Skill & Youth",
  };
  return labels[sector] || sector?.replace(/_/g, " ") || sector;
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    critical: "bg-red-500/10 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-800",
    high: "bg-orange-500/10 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-800",
    medium: "bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-800",
    low: "bg-green-500/10 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-800",
  };
  return colors[priority] || "";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    verified: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    clustered: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    prioritized: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    in_progress: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
    completed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    proposed: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    approved: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    on_hold: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  };
  return colors[status] || "";
}

export function timeAgo(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
