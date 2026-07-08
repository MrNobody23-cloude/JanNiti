"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScoreRing } from "@/components/ui/score-ring";
import { useFetch } from "@/lib/hooks";
import { formatCurrency, formatNumber, getSectorLabel, getPriorityColor, cn } from "@/lib/utils";
import {
  Filter,
  MapPin,
  Users,
  IndianRupee,
  Download,
  Plus,
  ChevronDown,
  Lightbulb,
  Globe2,
  Target,
  CheckCircle,
} from "lucide-react";
import { useState } from "react";

export default function ProjectsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const { data: apiProjects } = useFetch<any[]>("/api/projects", { params: { limit: 50, sortBy: "aiPriorityScore" } });
  const projects = apiProjects ?? [];

  const statusCounts = {
    all: projects.length,
    proposed: projects.filter((p: any) => p.status === "proposed").length,
    approved: projects.filter((p: any) => p.status === "approved").length,
    in_progress: projects.filter((p: any) => p.status === "in_progress").length,
    completed: projects.filter((p: any) => p.status === "completed").length,
  };

  const totalBudget = projects.reduce((sum: number, p: any) => sum + (p.estimatedCost ?? 0), 0);
  const totalAllocated = projects.reduce((sum: number, p: any) => sum + (p.allocatedBudget ?? 0), 0);
  const totalBeneficiaries = projects.reduce((sum: number, p: any) => sum + (p.beneficiaries ?? p.estimatedBeneficiaries ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="animate-fade-in flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Development Projects</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            AI-prioritized projects with Decision Intelligence scoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<Download className="h-3.5 w-3.5" />}>
            Export Report
          </Button>
          <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />}>
            New Project
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
              <Target className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{projects.length}</p>
              <p className="text-xs text-[var(--text-tertiary)]">Total Projects</p>
            </div>
          </div>
        </Card>
        <Card className="animate-slide-up" style={{ animationDelay: "50ms" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <IndianRupee className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{formatCurrency(totalAllocated)}</p>
              <p className="text-xs text-[var(--text-tertiary)]">Budget Allocated</p>
            </div>
          </div>
        </Card>
        <Card className="animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{formatNumber(totalBeneficiaries)}</p>
              <p className="text-xs text-[var(--text-tertiary)]">Est. Beneficiaries</p>
            </div>
          </div>
        </Card>
        <Card className="animate-slide-up" style={{ animationDelay: "150ms" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <CheckCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{statusCounts.in_progress}</p>
              <p className="text-xs text-[var(--text-tertiary)]">In Progress</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {projects.map((project: any, i: number) => (
          <Card
            key={project.id}
            hover
            className="animate-slide-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-start gap-5">
              {/* Score Ring */}
              <div className="flex flex-col items-center gap-1">
                <ScoreRing score={project.aiScore ?? project.aiPriorityScore ?? 0} size={72} strokeWidth={5} label="AI Score" />
                <div className="mt-1 flex items-center gap-0.5 text-[10px] font-medium text-primary-600">
                  <span>Rank #{i + 1}</span>
                </div>
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">
                      {project.title}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="info" size="sm">{getSectorLabel(project.sector)}</Badge>
                      <Badge className={getPriorityColor(project.priority)} size="sm">
                        {project.priority} priority
                      </Badge>
                      <Badge
                        variant={
                          project.status === "in_progress" ? "warning" :
                          project.status === "approved" ? "success" :
                          project.status === "completed" ? "success" : "default"
                        }
                        size="sm"
                        dot
                      >
                        {project.status.replace("_", " ")}
                      </Badge>
                      {project.sdgGoals?.map((g: any) => (
                        <Badge key={g} variant="default" size="sm">
                          <Globe2 className="h-2.5 w-2.5 mr-0.5" />
                          SDG {g}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">Est. Cost</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(project.estimatedCost)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">Allocated</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {project.allocatedBudget > 0 ? formatCurrency(project.allocatedBudget) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">Beneficiaries</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{formatNumber(project.beneficiaries ?? project.estimatedBeneficiaries ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">Villages</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{(project.villages ?? project.villageIds ?? []).length} linked</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">Completion</p>
                    <div className="flex items-center gap-2">
                      <Progress value={project.completion ?? project.completionPercentage ?? 0} size="sm" className="flex-1" barClassName={(project.completion ?? project.completionPercentage ?? 0) >= 50 ? "bg-emerald-500" : "bg-primary-500"} />
                      <span className="text-xs font-medium">{project.completion ?? project.completionPercentage ?? 0}%</span>
                    </div>
                  </div>
                </div>

                {/* Expand */}
                <button
                  onClick={() => setExpandedId(expandedId === project.id ? null : project.id)}
                  className="mt-3 flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  <Lightbulb className="h-3 w-3" />
                  View AI Analysis & Explanation
                  <ChevronDown className={cn("h-3 w-3 transition-transform", expandedId === project.id && "rotate-180")} />
                </button>

                {expandedId === project.id && (
                  <div className="mt-4 animate-fade-in space-y-4">
                    {/* Explanation */}
                    <div className="rounded-xl bg-primary-50/50 dark:bg-primary-900/10 p-4">
                      <h4 className="text-xs font-semibold uppercase text-primary-700 dark:text-primary-400 mb-2">
                        AI Priority Explanation
                      </h4>
                      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                        {project.explanation ?? project.description ?? "Run the Decision Engine to generate AI explanation."}
                      </p>
                    </div>

                    {/* Score Breakdown */}
                    <div className="grid grid-cols-5 gap-3">
                      {[
                        { label: "Citizen Demand", value: project.demandScore ?? 0, color: "#6366F1" },
                        { label: "Feasibility", value: project.feasibility ?? project.feasibilityScore ?? 0, color: "#22C55E" },
                        { label: "Social Impact", value: project.socialImpact ?? project.socialImpactScore ?? 0, color: "#F59E0B" },
                        { label: "Env. Impact", value: project.envImpact ?? project.environmentalImpactScore ?? 0, color: "#06B6D4" },
                        { label: "Infra Gap", value: project.infraGap ?? project.infrastructureGapScore ?? 0, color: "#EF4444" },
                      ].map((metric) => (
                        <div key={metric.label} className="text-center rounded-lg bg-[var(--bg-secondary)] p-3">
                          <ScoreRing score={metric.value} size={52} strokeWidth={4} color={metric.color} />
                          <p className="mt-1 text-[10px] font-medium text-[var(--text-tertiary)]">{metric.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
