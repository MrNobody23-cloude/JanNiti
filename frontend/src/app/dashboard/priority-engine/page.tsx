"use client";
import { projectsApi } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";
import { Progress } from "@/components/ui/progress";
import { useFetch } from "@/lib/hooks";
import { decisionEngineApi } from "@/lib/api";
import { formatCurrency, getSectorLabel, cn } from "@/lib/utils";
import {
  Brain,
  Layers,
  Sliders,
  TrendingUp,
  Shield,
  Scale,
  Leaf,
  Wrench,
  Users,
  Heart,
  Zap,
  ArrowRight,
} from "lucide-react";
import { useState, useEffect } from "react";

const WEIGHT_FACTORS = [
  { key: "demand", label: "Citizen Demand", icon: Users, weight: 25, description: "Volume, frequency, and urgency of citizen submissions" },
  { key: "infrastructure", label: "Infrastructure Gap", icon: Wrench, weight: 20, description: "Delta between current infrastructure and required levels" },
  { key: "social", label: "Social Impact", icon: Heart, weight: 20, description: "Beneficiary count, equity indicators, SC/ST impact" },
  { key: "feasibility", label: "Feasibility", icon: Shield, weight: 15, description: "Technical feasibility, timeline, resource availability" },
  { key: "environmental", label: "Environmental", icon: Leaf, weight: 10, description: "Environmental sustainability and climate resilience" },
  { key: "cost", label: "Cost Efficiency", icon: Scale, weight: 10, description: "Cost per beneficiary, co-funding potential, ROI" },
];

export default function PriorityEnginePage() {
  const [weights, setWeights] = useState(
    WEIGHT_FACTORS.reduce((acc, f) => ({ ...acc, [f.key]: f.weight }), {} as Record<string, number>)
  );
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    projectsApi
      .list({
        limit: 20,
        sortBy: "aiPriorityScore",
        sortOrder: "desc",
      })
      .then((res) => {
        setProjects(res.data ?? []);
      })
      .catch((err) => {
        console.error("Projects fetch failed:", err);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
            <Brain className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Decision Intelligence Engine</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Transparent AI-powered project prioritization with explainable scoring
            </p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <Card className="animate-slide-up gradient-govt text-white">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="h-5 w-5 text-primary-300" />
          <h2 className="text-lg font-semibold">How the Engine Works</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          {[
            { step: 1, title: "Data Collection", desc: "Citizen submissions, census data, infrastructure surveys" },
            { step: 2, title: "AI Processing", desc: "NLP, clustering, sentiment analysis, duplicate detection" },
            { step: 3, title: "Multi-Factor Scoring", desc: "Weighted scoring across 6 dimensions" },
            { step: 4, title: "Ranking & Explanation", desc: "Transparent ranking with detailed explanations" },
            { step: 5, title: "Recommendations", desc: "Budget optimization, scheme matching, timeline planning" },
          ].map((s, i) => (
            <div key={s.step} className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold">
                {s.step}
              </div>
              <div>
                <h3 className="text-sm font-semibold">{s.title}</h3>
                <p className="mt-0.5 text-xs text-primary-200">{s.desc}</p>
              </div>
              {i < 4 && <ArrowRight className="hidden sm:block h-4 w-4 mt-2 text-primary-400 shrink-0" />}
            </div>
          ))}
        </div>
      </Card>

      {/* Weight Configuration */}
      <Card className="animate-slide-up" style={{ animationDelay: "100ms" }}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary-500" />
            <CardTitle>Priority Weights Configuration</CardTitle>
          </div>
          <Badge variant="info" size="sm">Customizable</Badge>
        </CardHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WEIGHT_FACTORS.map((factor) => (
            <div
              key={factor.key}
              className="rounded-xl border border-[var(--border-primary)] p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/20">
                  <factor.icon className="h-4 w-4 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">{factor.label}</h4>
                  <p className="text-[10px] text-[var(--text-tertiary)]">{factor.description}</p>
                </div>
                <span className="text-lg font-bold text-primary-600">{weights[factor.key]}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={weights[factor.key]}
                onChange={(e) => setWeights(prev => ({ ...prev, [factor.key]: Number(e.target.value) }))}
                className="mt-3 w-full accent-primary-600"
                aria-label={`${factor.label} weight`}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Ranked Projects */}
      <Card className="animate-slide-up" style={{ animationDelay: "200ms" }}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary-500" />
            <CardTitle>AI-Ranked Project Pipeline</CardTitle>
          </div>
          <Badge variant="success" size="sm" dot>Live Rankings</Badge>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b border-[var(--border-primary)]">
                <th className="pb-3 pr-4 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase">Rank</th>
                <th className="pb-3 pr-4 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase">Project</th>
                <th className="pb-3 pr-4 text-center text-xs font-semibold text-[var(--text-tertiary)] uppercase">AI Score</th>
                <th className="pb-3 pr-4 text-center text-xs font-semibold text-[var(--text-tertiary)] uppercase">Demand</th>
                <th className="pb-3 pr-4 text-center text-xs font-semibold text-[var(--text-tertiary)] uppercase">Feasibility</th>
                <th className="pb-3 pr-4 text-center text-xs font-semibold text-[var(--text-tertiary)] uppercase">Social</th>
                <th className="pb-3 pr-4 text-center text-xs font-semibold text-[var(--text-tertiary)] uppercase">Env.</th>
                <th className="pb-3 pr-4 text-center text-xs font-semibold text-[var(--text-tertiary)] uppercase">Infra Gap</th>
                <th className="pb-3 text-right text-xs font-semibold text-[var(--text-tertiary)] uppercase">Cost</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project: any, i: number) => (
                <tr
                  key={project.id}
                  className="border-b border-[var(--border-primary)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <td className="py-4 pr-4">
                    <span className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                      i < 3 ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400" : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
                    )}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-4 pr-4">
                    <p className="font-medium text-[var(--text-primary)]">{project.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="info" size="sm">{getSectorLabel(project.sector)}</Badge>
                      <Badge className={getPriorityBadge(project.priority)} size="sm">{project.priority}</Badge>
                    </div>
                  </td>
                  <td className="py-4 pr-4 text-center">
                    <ScoreRing score={project.aiScore ?? project.aiPriorityScore ?? 0} size={48} strokeWidth={3} />
                  </td>
                  <td className="py-4 pr-4 text-center">
                    <MetricCell value={project.demandScore ?? 0} />
                  </td>
                  <td className="py-4 pr-4 text-center">
                    <MetricCell value={project.feasibility ?? project.feasibilityScore ?? 0} />
                  </td>
                  <td className="py-4 pr-4 text-center">
                    <MetricCell value={project.socialImpact ?? project.socialImpactScore ?? 0} />
                  </td>
                  <td className="py-4 pr-4 text-center">
                    <MetricCell value={project.envImpact ?? project.environmentalImpactScore ?? 0} />
                  </td>
                  <td className="py-4 pr-4 text-center">
                    <MetricCell value={project.infraGap ?? project.infrastructureGapScore ?? 0} />
                  </td>
                  <td className="py-4 text-right text-sm font-medium text-[var(--text-primary)]">
                    {formatCurrency(project.estimatedCost ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function MetricCell({ value }: { value: number }) {
  return (
    <div className="inline-flex flex-col items-center">
      <span className={cn(
        "text-sm font-bold",
        value >= 80 ? "text-emerald-600 dark:text-emerald-400" :
          value >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
      )}>
        {value}
      </span>
      <Progress
        value={value}
        size="sm"
        className="w-12 mt-1"
        barClassName={
          value >= 80 ? "bg-emerald-500" :
            value >= 60 ? "bg-amber-500" : "bg-red-500"
        }
      />
    </div>
  );
}

function getPriorityBadge(priority: string) {
  const map: Record<string, string> = {
    critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };
  return map[priority] || "";
}
