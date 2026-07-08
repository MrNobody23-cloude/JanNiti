"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from "@/lib/utils";
import { budgetApi } from "@/lib/api";
import {
  IndianRupee, Download, FileText, Loader2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useState, useEffect } from "react";

export default function BudgetPage() {
  const [budgetData, setBudgetData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    budgetApi
      .get()
      .then((res) => {
        setBudgetData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      </div>
    );
  }

  const summary = budgetData?.summary ?? { totalAllocated: 0, totalSpent: 0, balance: 0, utilizationRate: 0 };
  const allocations = budgetData?.allocations ?? [];
  const sectorBreakdown = allocations[0]?.sectorBreakdown ?? {};

  const chartData = Object.entries(sectorBreakdown).map(([sector, vals]: [string, any]) => ({
    sector: sector.replace(/_/g, " "),
    allocated: vals.allocated ?? 0,
    spent: vals.spent ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div className="animate-fade-in flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
            <IndianRupee className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Budget & MPLADS Management</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Fund allocation, utilization tracking, and budget management
            </p>
          </div>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card hover className="animate-slide-up">
          <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase">Total Allocated</p>
          <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">{formatCurrency(summary.totalAllocated)}</p>
        </Card>
        <Card hover className="animate-slide-up" style={{ animationDelay: "50ms" }}>
          <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase">Utilized</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{formatCurrency(summary.totalSpent)}</p>
          <Progress value={summary.utilizationRate} size="sm" barClassName="bg-emerald-500" className="mt-2" />
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">{summary.utilizationRate}% utilization</p>
        </Card>
        <Card hover className="animate-slide-up" style={{ animationDelay: "100ms" }}>
          <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase">Balance</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">{formatCurrency(summary.balance)}</p>
        </Card>
        <Card hover className="animate-slide-up" style={{ animationDelay: "150ms" }}>
          <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase">Financial Years</p>
          <p className="mt-2 text-3xl font-bold text-purple-600">{allocations.length}</p>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">{allocations.map((a: any) => a.financialYear).join(", ")}</p>
        </Card>
      </div>

      {/* Budget by Sector Chart */}
      <Card className="animate-slide-up" style={{ animationDelay: "200ms" }}>
        <CardHeader>
          <CardTitle>Sector-wise Budget Allocation vs. Expenditure</CardTitle>
        </CardHeader>
        <div className="h-80">
          {chartData.length === 0 ? (
            <p className="text-center text-sm text-[var(--text-tertiary)] py-12">No sector data available</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis dataKey="sector" stroke="var(--text-tertiary)" fontSize={11} angle={-15} textAnchor="end" height={60} />
                <YAxis stroke="var(--text-tertiary)" fontSize={11} tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)", borderRadius: "8px", color: "var(--text-primary)" }} formatter={(value: unknown) => [formatCurrency(Number(value))]} />
                <Bar dataKey="allocated" fill="#6366F1" name="Allocated" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spent" fill="#22C55E" name="Spent" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Sector Detail Table */}
      <Card className="animate-slide-up" style={{ animationDelay: "300ms" }}>
        <CardHeader>
          <CardTitle>Detailed Allocation Breakdown</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b border-[var(--border-primary)]">
                <th className="pb-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase">Sector</th>
                <th className="pb-3 text-right text-xs font-semibold text-[var(--text-tertiary)] uppercase">Allocated</th>
                <th className="pb-3 text-right text-xs font-semibold text-[var(--text-tertiary)] uppercase">Spent</th>
                <th className="pb-3 text-center text-xs font-semibold text-[var(--text-tertiary)] uppercase">Utilization</th>
                <th className="pb-3 text-center text-xs font-semibold text-[var(--text-tertiary)] uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((row) => {
                const util = row.allocated > 0 ? (row.spent / row.allocated) * 100 : 0;
                return (
                  <tr key={row.sector} className="border-b border-[var(--border-primary)] last:border-0 hover:bg-[var(--bg-secondary)]">
                    <td className="py-3 font-medium text-[var(--text-primary)] capitalize">{row.sector}</td>
                    <td className="py-3 text-right text-[var(--text-secondary)]">{formatCurrency(row.allocated)}</td>
                    <td className="py-3 text-right text-[var(--text-secondary)]">{formatCurrency(row.spent)}</td>
                    <td className="py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Progress value={util} size="sm" className="w-20" barClassName={util >= 80 ? "bg-emerald-500" : util >= 50 ? "bg-amber-500" : "bg-red-500"} />
                        <span className="text-xs font-medium">{util.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <Badge variant={util >= 80 ? "success" : util >= 50 ? "warning" : "danger"} size="sm">
                        {util >= 80 ? "On Track" : util >= 50 ? "Moderate" : "Low"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
