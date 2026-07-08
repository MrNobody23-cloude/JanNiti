"use client";
import { projectsApi } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScoreRing } from "@/components/ui/score-ring";
import { formatCurrency, formatNumber, getSectorLabel, getPriorityColor } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  MapPin,
  Users,
  IndianRupee,
  ChevronDown,
  Lightbulb,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export function PriorityProjects() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectsApi
      .list({
        limit: 5,
        sortBy: "aiPriorityScore",
      })
      .then((res) => {
        setProjects(res.data ?? []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("PriorityProjects fetch failed:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>AI-Prioritized Projects</CardTitle>
        </CardHeader>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="animate-slide-up" style={{ animationDelay: "150ms" }}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <CardTitle>AI-Prioritized Projects</CardTitle>
        </div>
        <Link
          href="/dashboard/projects"
          className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
        >
          All Projects <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>

      {projects.length === 0 && (
        <p className="text-center text-sm text-[var(--text-tertiary)] py-8">No projects found</p>
      )}

      <div className="space-y-3">
        {projects.map((project: any, index: number) => (
          <div
            key={project.id}
            className={cn(
              "rounded-xl border border-[var(--border-primary)] p-4 transition-all duration-200",
              "hover:border-primary-200 dark:hover:border-primary-800",
              expandedId === project.id && "border-primary-300 dark:border-primary-700 shadow-[var(--shadow-sm)]"
            )}
          >
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-tertiary)] text-sm font-bold text-[var(--text-secondary)]">
                #{index + 1}
              </div>

              {/* Score */}
              <ScoreRing score={project.aiPriorityScore ?? 0} size={56} strokeWidth={4} />

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                    {project.title}
                  </h4>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="info" size="sm">
                      {getSectorLabel(project.sector)}
                    </Badge>
                    <Badge className={getPriorityColor(project.priority)} size="sm">
                      {project.priority}
                    </Badge>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
                  <span className="flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {formatCurrency(project.estimatedCost ?? 0)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {formatNumber(project.estimatedBeneficiaries ?? 0)} beneficiaries
                  </span>
                </div>

                {/* Progress */}
                {(project.completionPercentage ?? 0) > 0 && (
                  <div className="mt-3 flex items-center gap-3">
                    <Progress
                      value={project.completionPercentage ?? 0}
                      size="sm"
                      barClassName={
                        (project.completionPercentage ?? 0) >= 50 ? "bg-emerald-500" : "bg-primary-500"
                      }
                      className="flex-1"
                    />
                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                      {project.completionPercentage ?? 0}%
                    </span>
                  </div>
                )}

                {/* Expand button */}
                <button
                  onClick={() => setExpandedId(expandedId === project.id ? null : project.id)}
                  className="mt-2 flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  <Lightbulb className="h-3 w-3" />
                  Details
                  <ChevronDown className={cn("h-3 w-3 transition-transform", expandedId === project.id && "rotate-180")} />
                </button>
              </div>
            </div>

            {/* Expanded */}
            {expandedId === project.id && (
              <div className="mt-4 animate-fade-in rounded-lg bg-primary-50/50 dark:bg-primary-900/10 p-4">
                <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                  {project.description ?? "No description available."}
                </p>
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {[
                    { label: "Demand", value: project.demandScore ?? 0 },
                    { label: "Feasibility", value: project.feasibilityScore ?? 0 },
                    { label: "Social", value: project.socialImpactScore ?? 0 },
                    { label: "Environment", value: project.environmentalImpactScore ?? 0 },
                    { label: "Infra Gap", value: project.infrastructureGapScore ?? 0 },
                  ].map((metric) => (
                    <div key={metric.label} className="text-center">
                      <div className="text-lg font-bold text-[var(--text-primary)]">{Math.round(metric.value)}</div>
                      <div className="text-[10px] text-[var(--text-tertiary)]">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
