"use client";

import { KPICards } from "@/components/dashboard/kpi-cards";
import { analyticsApi } from "@/lib/api";
import {
  SubmissionTrendsChart,
  SectorDistributionChart,
  SentimentChart,
  BudgetChart,
} from "@/components/dashboard/charts";
import { PriorityProjects } from "@/components/dashboard/priority-projects";
import { AIInsights } from "@/components/dashboard/ai-insights";
import { RecentSubmissions } from "@/components/dashboard/recent-submissions";
import { VillageRankings } from "@/components/dashboard/village-rankings";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScoreRing } from "@/components/ui/score-ring";
import { cn } from "@/lib/utils";
import {
  Sparkles, Calendar, Bot, TrendingUp, AlertTriangle, Layers, ArrowRight,
  MessageSquare, Brain, Clock, Users,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const channelData = [
  { channel: "Web Portal", count: 1542, percentage: 36 },
  { channel: "WhatsApp", count: 1114, percentage: 26 },
  { channel: "SMS", count: 685, percentage: 16 },
  { channel: "Voice Call", count: 471, percentage: 11 },
  { channel: "Mobile App", count: 342, percentage: 8 },
  { channel: "Offline", count: 133, percentage: 3 },
];

const demandForecast = [
  { month: "Feb", actual: 0, predicted: 365 },
  { month: "Mar", actual: 0, predicted: 390 },
  { month: "Apr", actual: 0, predicted: 420 },
  { month: "May", actual: 0, predicted: 380 },
  { month: "Jun", actual: 0, predicted: 450 },
  { month: "Jul", actual: 0, predicted: 520 },
];

export default function DashboardPage() {
  const [clusters, setClusters] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState(68.5);



  useEffect(() => {
    analyticsApi
      .getDashboard({ period: "all" })
      .then((res) => {
        const data = res.data;

        if (data?.submissions?.total) {
          const resolved = Number(data.projects?.completed ?? 0);
          const total = Number(data.projects?.total ?? 1);

          setHealthScore(
            Math.round((resolved / total) * 100 * 0.7 + 30)
          );
        }

        if (data?.sectorDistribution) {
          setClusters(
            data.sectorDistribution.slice(0, 4).map((s: any, i: number) => ({
              id: `c${i}`,
              name: s.sector?.replace(/_/g, " ") ?? "Unknown",
              count: Number(s.count ?? 0),
              trend:
                Number(s.avgUrgency ?? 0) > 0.7
                  ? "critical"
                  : Number(s.avgUrgency ?? 0) > 0.5
                    ? "rising"
                    : "stable",
              villages: [],
            }))
          );
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              JanNiti AI Dashboard
            </h1>
            <Badge variant="info" size="md" dot dotColor="bg-emerald-500">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Powered
            </Badge>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Varanasi Parliamentary Constituency · Uttar Pradesh · Real-time AI analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/copilot">
            <Button variant="primary" size="sm" icon={<Bot className="h-3.5 w-3.5" />}>
              Ask AI Copilot
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
            <Calendar className="h-3.5 w-3.5" />
            {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        </div>
      </div>

      {/* Constituency Health Score */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="animate-slide-up lg:col-span-1" glow>
          <div className="flex items-center gap-6">
            <ScoreRing
              score={healthScore}
              size={100}
              strokeWidth={8}
              label="Health Score"
            />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Constituency Health</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Composite score based on infrastructure, services, and citizen satisfaction
              </p>
              <div className="mt-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-600">+4.2% from last month</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="animate-slide-up lg:col-span-2" style={{ animationDelay: "50ms" }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary-500" />
              <CardTitle>Active AI Clusters</CardTitle>
            </div>
            <Link href="/dashboard/knowledge-graph" className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View Graph <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {clusters.slice(0, 4).map((cluster: any) => (
              <div
                key={cluster.id}
                className={cn(
                  "rounded-lg border p-3 transition-all hover:shadow-sm",
                  cluster.trend === "critical"
                    ? "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10"
                    : cluster.trend === "rising"
                      ? "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10"
                      : "border-[var(--border-primary)] bg-[var(--bg-secondary)]"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "text-xs font-bold",
                    cluster.trend === "critical" ? "text-red-600" :
                      cluster.trend === "rising" ? "text-amber-600" : "text-[var(--text-primary)]"
                  )}>
                    {cluster.count}
                  </span>
                  {cluster.trend === "critical" && (
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                  )}
                </div>
                <p className="text-xs font-medium text-[var(--text-primary)] leading-tight line-clamp-2">
                  {cluster.name}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                  {cluster.villages.slice(0, 2).join(", ")}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* KPIs */}
      <KPICards />

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SubmissionTrendsChart />
        <SectorDistributionChart />
      </div>

      {/* AI + Projects Row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PriorityProjects />
        <AIInsights />
      </div>

      {/* Submissions + Village Rankings */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RecentSubmissions />
        <VillageRankings />
      </div>

      {/* Sentiment + Budget */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SentimentChart />
        <BudgetChart />
      </div>

      {/* Analytics Section - Key Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Avg. Submissions/Day", value: "14.3", icon: MessageSquare, change: "+18%", positive: true, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
          { label: "AI Cluster Accuracy", value: "94.7%", icon: Brain, change: "+2.1%", positive: true, color: "text-indigo-600", bg: "bg-indigo-100 dark:bg-indigo-900/30" },
          { label: "Avg. Resolution Time", value: "4.2d", icon: Clock, change: "-15%", positive: true, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
          { label: "Citizen Engagement", value: "23.4%", icon: Users, change: "+5.8%", positive: true, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" },
        ].map((metric) => (
          <Card key={metric.label} hover className="animate-slide-up">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${metric.bg}`}>
                <metric.icon className={`h-5 w-5 ${metric.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{metric.value}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{metric.label}</p>
                <span className={`text-xs font-medium ${metric.positive ? "text-emerald-600" : "text-red-600"}`}>
                  {metric.change}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Demand Forecast + Channel Analysis */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="animate-slide-up">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <CardTitle>AI Demand Forecast</CardTitle>
            </div>
            <Badge variant="info" size="sm">6-month prediction</Badge>
          </CardHeader>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={demandForecast}>
                <defs>
                  <linearGradient id="predictedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis dataKey="month" stroke="var(--text-tertiary)" fontSize={12} />
                <YAxis stroke="var(--text-tertiary)" fontSize={12} />
                <Tooltip contentStyle={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-primary)",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                }} />
                <Area type="monotone" dataKey="actual" stroke="#6366F1" fill="rgba(99,102,241,0.1)" strokeWidth={2} name="Actual" />
                <Area type="monotone" dataKey="predicted" stroke="#A855F7" fill="url(#predictedGrad)" strokeWidth={2} strokeDasharray="8 4" name="Predicted" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: "100ms" }}>
          <CardHeader>
            <CardTitle>Submission Channel Analysis</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {channelData.map((ch) => (
              <div key={ch.channel} className="rounded-xl border border-[var(--border-primary)] p-4 text-center">
                <p className="text-2xl font-bold text-[var(--text-primary)]">{ch.percentage}%</p>
                <Progress value={ch.percentage} size="sm" className="mt-2" barClassName="bg-primary-500" />
                <p className="mt-2 text-xs font-medium text-[var(--text-secondary)]">{ch.channel}</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">{ch.count.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
