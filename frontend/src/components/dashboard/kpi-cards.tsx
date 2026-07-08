"use client";
import { analyticsApi } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import {
  ArrowUpRight,
  ArrowDownRight,
  MessageSquare,
  Target,
  Wallet,
  Heart,
  Clock,
  Brain,
  MapPin,
  CheckCircle,
} from "lucide-react";
import { useState, useEffect } from "react";

interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  trend?: number;
  icon: React.ReactNode;
  iconBg: string;
  delay: number;
}

function KPICard({ title, value, subtitle, trend, icon, iconBg, delay }: KPICardProps) {
  return (
    <Card
      hover
      className="animate-slide-up"
      style={{ animationDelay: `${delay}ms` } as React.CSSProperties}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
            {title}
          </p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
          <div className="flex items-center gap-2">
            {trend !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium",
                  trend >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                )}
              >
                {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(trend)}%
              </span>
            )}
            <span className="text-xs text-[var(--text-tertiary)]">{subtitle}</span>
          </div>
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", iconBg)}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

export function KPICards() {
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    analyticsApi
      .getDashboard({ period: "all" })
      .then((res) => {
        const data = res.data;
        // existing logic...
      })
      .catch((err) => {
        console.error("KPI fetch failed:", err);
      });
  }, []);

  const totalSubmissions = analytics?.submissions?.total ?? 0;
  const activeProjects = analytics?.projects?.inProgress ?? 0;
  const completedProjects = analytics?.projects?.completed ?? 0;
  const budgetAllocated = analytics?.projects?.totalBudgetAllocated ?? 0;
  const totalProjects = analytics?.projects?.total ?? 0;

  const kpis = [
    {
      title: "Total Submissions",
      value: totalSubmissions > 0 ? formatNumber(totalSubmissions) : "...",
      subtitle: `from all channels`,
      trend: 18.5,
      icon: <MessageSquare className="h-5 w-5 text-blue-600" />,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Active Projects",
      value: String(activeProjects || "..."),
      subtitle: `${completedProjects} completed`,
      trend: 8.3,
      icon: <Target className="h-5 w-5 text-purple-600" />,
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      title: "Budget Allocated",
      value: budgetAllocated > 0 ? formatCurrency(budgetAllocated) : "...",
      subtitle: `across ${totalProjects} projects`,
      trend: 12.1,
      icon: <Wallet className="h-5 w-5 text-emerald-600" />,
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      title: "Citizen Satisfaction",
      value: "72.8%",
      subtitle: "NPS Score",
      trend: 4.8,
      icon: <Heart className="h-5 w-5 text-pink-600" />,
      iconBg: "bg-pink-100 dark:bg-pink-900/30",
    },
    {
      title: "Avg Response Time",
      value: "4.2 days",
      subtitle: "submission to action",
      trend: -15.2,
      icon: <Clock className="h-5 w-5 text-amber-600" />,
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      title: "AI Accuracy",
      value: "94.7%",
      subtitle: "prediction accuracy",
      trend: 2.1,
      icon: <Brain className="h-5 w-5 text-indigo-600" />,
      iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
    },
    {
      title: "Villages Covered",
      value: "8",
      subtitle: "of 1,642 total",
      trend: 5.4,
      icon: <MapPin className="h-5 w-5 text-cyan-600" />,
      iconBg: "bg-cyan-100 dark:bg-cyan-900/30",
    },
    {
      title: "Resolution Rate",
      value: completedProjects > 0 ? `${Math.round((Number(completedProjects) / totalProjects) * 100)}%` : "...",
      subtitle: "projects completed",
      trend: 6.2,
      icon: <CheckCircle className="h-5 w-5 text-teal-600" />,
      iconBg: "bg-teal-100 dark:bg-teal-900/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, i) => (
        <KPICard key={kpi.title} {...kpi} delay={i * 50} />
      ))}
    </div>
  );
}
