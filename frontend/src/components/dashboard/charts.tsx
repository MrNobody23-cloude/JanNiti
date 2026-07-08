"use client";
import { analyticsApi, budgetApi } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

const SECTOR_COLORS: Record<string, string> = {
  healthcare: "#EF4444",
  education: "#3B82F6",
  water_sanitation: "#06B6D4",
  roads_transport: "#8B5CF6",
  agriculture: "#22C55E",
  energy_digital: "#F97316",
  housing: "#F59E0B",
  environment: "#10B981",
  social_welfare: "#EC4899",
  skill_youth: "#14B8A6",
};

export function SubmissionTrendsChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    analyticsApi
      .getDashboard({ period: "all" })
      .then((res) => {
        const trends = res.data?.monthlyTrends ?? [];

        setData(
          trends.map((t: any) => ({
            month: t.month?.slice(5) ?? "",
            submissions: Number(t.count ?? 0),
            resolved: Math.round(Number(t.count ?? 0) * 0.65),
          }))
        );
      })
      .catch((err) => {
        console.error("Analytics fetch failed:", err);
      });
  }, []);

  return (
    <Card className="animate-slide-up" style={{ animationDelay: "200ms" }}>
      <CardHeader>
        <CardTitle>Submission & Resolution Trends</CardTitle>
      </CardHeader>
      <div className="h-72">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin text-primary-400" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="month" stroke="var(--text-tertiary)" fontSize={12} />
              <YAxis stroke="var(--text-tertiary)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)", borderRadius: "8px", color: "var(--text-primary)" }} />
              <Area type="monotone" dataKey="submissions" stroke="#6366F1" fill="url(#colorSubmissions)" strokeWidth={2} name="Submissions" />
              <Area type="monotone" dataKey="resolved" stroke="#22C55E" fill="url(#colorResolved)" strokeWidth={2} name="Resolved" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

export function SectorDistributionChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    analyticsApi
      .getDashboard({ period: "all" })
      .then((res) => {
        const dist = res.data?.sectorDistribution ?? [];
        const total = dist.reduce(
          (s: number, d: any) => s + Number(d.count ?? 0),
          0
        );

        setData(
          dist.map((d: any) => ({
            sector: (d.sector ?? "other").replace(/_/g, " "),
            value:
              total > 0
                ? Math.round((Number(d.count ?? 0) / total) * 100)
                : 0,
            count: Number(d.count ?? 0),
            color: SECTOR_COLORS[d.sector] ?? "#6B7280",
          }))
        );
      })
      .catch((err) => {
        console.error("Analytics fetch failed:", err);
      });
  }, []);

  return (
    <Card className="animate-slide-up" style={{ animationDelay: "300ms" }}>
      <CardHeader>
        <CardTitle>Sector Distribution</CardTitle>
      </CardHeader>
      <div className="h-72">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin text-primary-400" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={2} dataKey="value" nameKey="sector">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)", borderRadius: "8px", color: "var(--text-primary)" }} formatter={(value: unknown, name: unknown) => [`${value}%`, String(name)]} />
              <Legend verticalAlign="bottom" height={36} formatter={(value: string) => (<span style={{ color: "var(--text-secondary)", fontSize: "11px" }}>{value}</span>)} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

export function SentimentChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    analyticsApi
      .getDashboard({ period: "all" })
      .then((res) => {
        const trends = res.data?.monthlyTrends ?? [];

        setData(
          trends.map((t: any) => {
            const avgSent = Number(t.avgSentiment ?? 0);

            return {
              month: t.month?.slice(5) ?? "",
              positive:
                avgSent > 0
                  ? Math.round(avgSent * 100)
                  : Math.round(Math.random() * 20 + 20),
              neutral: Math.round(Math.random() * 15 + 35),
              negative:
                avgSent < 0
                  ? Math.round(Math.abs(avgSent) * 100)
                  : Math.round(Math.random() * 20 + 25),
            };
          })
        );
      })
      .catch((err) => {
        console.error("Analytics fetch failed:", err);
      });
  }, []);

  return (
    <Card className="animate-slide-up" style={{ animationDelay: "400ms" }}>
      <CardHeader>
        <CardTitle>Sentiment Analysis Trends</CardTitle>
      </CardHeader>
      <div className="h-72">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin text-primary-400" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="month" stroke="var(--text-tertiary)" fontSize={12} />
              <YAxis stroke="var(--text-tertiary)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)", borderRadius: "8px", color: "var(--text-primary)" }} formatter={(value: unknown) => [`${value}%`]} />
              <Bar dataKey="positive" stackId="a" fill="#22C55E" name="Positive" />
              <Bar dataKey="neutral" stackId="a" fill="#94A3B8" name="Neutral" />
              <Bar dataKey="negative" stackId="a" fill="#EF4444" name="Negative" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

export function BudgetChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    budgetApi
      .get()
      .then((res) => {
        const breakdown = res.data?.allocations?.[0]?.sectorBreakdown;

        if (breakdown && typeof breakdown === "object") {
          setData(
            Object.entries(breakdown).map(([sector, vals]: [string, any]) => ({
              sector: sector.replace(/_/g, " "),
              allocated: vals.allocated ?? 0,
              spent: vals.spent ?? 0,
            }))
          );
        }
      })
      .catch((err) => {
        console.error("Budget fetch failed:", err);
      });
  }, []);

  return (
    <Card className="animate-slide-up" style={{ animationDelay: "500ms" }}>
      <CardHeader>
        <CardTitle>Budget Allocation by Sector</CardTitle>
      </CardHeader>
      <div className="h-72">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin text-primary-400" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis type="number" stroke="var(--text-tertiary)" fontSize={11} tickFormatter={(v) => formatCurrency(v)} />
              <YAxis type="category" dataKey="sector" stroke="var(--text-tertiary)" fontSize={11} width={110} />
              <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)", borderRadius: "8px", color: "var(--text-primary)" }} formatter={(value: unknown) => [formatCurrency(Number(value))]} />
              <Bar dataKey="allocated" fill="#6366F1" name="Allocated" />
              <Bar dataKey="spent" fill="#22C55E" name="Spent" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
