"use client";
import { constituenciesApi, mapsApi } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn, formatNumber } from "@/lib/utils";
import { MapPin, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export function VillageRankings() {
  const [villages, setVillages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    constituenciesApi
      .list()
      .then(() => mapsApi.hotspots({ type: "villages" }))
      .then((res) => {
        const features = res.data?.features ?? [];

        const sorted = features
          .map((f: any) => f.properties)
          .sort(
            (a: any, b: any) =>
              (a.infrastructureScore ?? 0) - (b.infrastructureScore ?? 0)
          );

        setVillages(sorted);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Card className="animate-slide-up" style={{ animationDelay: "300ms" }}>
        <CardHeader><CardTitle>Village Infrastructure Rankings</CardTitle></CardHeader>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="animate-slide-up" style={{ animationDelay: "300ms" }}>
      <CardHeader>
        <CardTitle>Village Infrastructure Rankings</CardTitle>
      </CardHeader>
      {villages.length === 0 && (
        <p className="text-center text-sm text-[var(--text-tertiary)] py-8">No village data</p>
      )}
      <div className="space-y-3">
        {villages.map((village: any, i: number) => (
          <div key={i} className="flex items-center gap-3">
            <div className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
              (village.infrastructureScore ?? 0) < 0.4 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                (village.infrastructureScore ?? 0) < 0.6 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            )}>
              {i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{village.name ?? "Village"}</p>
                <span className="text-xs font-bold text-[var(--text-secondary)]">
                  {Math.round((village.infrastructureScore ?? 0) * 100)}%
                </span>
              </div>
              <Progress
                value={(village.infrastructureScore ?? 0) * 100}
                size="sm"
                className="mt-1"
                barClassName={
                  (village.infrastructureScore ?? 0) < 0.4 ? "bg-red-500" :
                    (village.infrastructureScore ?? 0) < 0.6 ? "bg-amber-500" : "bg-emerald-500"
                }
              />
              <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">
                Pop: {formatNumber(village.population ?? 0)} · Submissions: {village.submissionCount ?? 0}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
