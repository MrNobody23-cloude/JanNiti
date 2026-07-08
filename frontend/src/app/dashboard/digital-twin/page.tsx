"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { digitalTwinApi } from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Layers3,
  ArrowRight,
  TrendingUp,
  Users,
  Heart,
  GraduationCap,
  Wrench,
  Target,
  Sparkles,
  Play,
  RotateCcw,
  Brain,
} from "lucide-react";
import { useState } from "react";

export default function DigitalTwinPage() {
  const [selectedScenario, setSelectedScenario] = useState<"baseline" | "optimized" | "aggressive">("baseline");
  const [simRunning, setSimRunning] = useState(false);
  const [simComplete, setSimComplete] = useState(false);

  const scenarios: Record<string, { name: string; budget: number; projects: number; beneficiaries: number; healthImprovement: number; educationImprovement: number; infraImprovement: number; satisfactionDelta: number }> = {
    baseline: { name: "Current Plan", budget: 250000000, projects: 10, beneficiaries: 245000, healthImprovement: 15, educationImprovement: 12, infraImprovement: 18, satisfactionDelta: 4.8 },
    optimized: { name: "AI-Optimized Plan", budget: 250000000, projects: 14, beneficiaries: 312000, healthImprovement: 22, educationImprovement: 19, infraImprovement: 25, satisfactionDelta: 8.2 },
    aggressive: { name: "High-Impact Plan", budget: 350000000, projects: 20, beneficiaries: 425000, healthImprovement: 32, educationImprovement: 28, infraImprovement: 35, satisfactionDelta: 12.5 },
  };
  const current = scenarios[selectedScenario];

  const runSimulation = () => {
    setSimRunning(true);
    setSimComplete(false);
    setTimeout(() => {
      setSimRunning(false);
      setSimComplete(true);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-in flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
            <Layers3 className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Digital Twin Simulator</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Scenario modeling for constituency development – compare outcomes under different strategies
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={() => { setSimComplete(false); setSimRunning(false); }}
          >
            Reset
          </Button>
          <Button
            size="sm"
            icon={simRunning ? <Sparkles className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            onClick={runSimulation}
            disabled={simRunning}
          >
            {simRunning ? "Simulating..." : "Run Simulation"}
          </Button>
        </div>
      </div>

      {/* Scenario Selection */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {(Object.entries(scenarios) as Array<[string, typeof scenarios.baseline]>).map(([key, scenario]) => (
          <Card
            key={key}
            hover
            glow={selectedScenario === key}
            className={cn(
              "cursor-pointer transition-all animate-slide-up",
              selectedScenario === key && "ring-2 ring-primary-500"
            )}
            style={{ animationDelay: `${Object.keys(scenarios).indexOf(key) * 100}ms` }}
          >
            <button
              onClick={() => setSelectedScenario(key as "baseline" | "optimized" | "aggressive")}
              className="w-full text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{scenario.name}</h3>
                {selectedScenario === key && (
                  <Badge variant="success" size="sm" dot>Selected</Badge>
                )}
                {key === "optimized" && (
                  <Badge variant="info" size="sm">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Recommended
                  </Badge>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-tertiary)]">Budget</span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(scenario.budget)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-tertiary)]">Projects</span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{scenario.projects}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-tertiary)]">Beneficiaries</span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{(scenario.beneficiaries / 1000).toFixed(0)}K</span>
                </div>
              </div>
            </button>
          </Card>
        ))}
      </div>

      {/* Simulation Results */}
      {simComplete && (
        <div className="animate-slide-up space-y-6">
          {/* Impact Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Projected Impact: {current.name}</CardTitle>
              <Badge variant="success" size="sm">Simulation Complete</Badge>
            </CardHeader>

            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {[
                { label: "Healthcare Improvement", value: current.healthImprovement, icon: Heart, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
                { label: "Education Improvement", value: current.educationImprovement, icon: GraduationCap, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
                { label: "Infrastructure Improvement", value: current.infraImprovement, icon: Wrench, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
                { label: "Satisfaction Change", value: current.satisfactionDelta, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
              ].map((metric) => (
                <div key={metric.label} className={`rounded-xl ${metric.bg} p-5 text-center`}>
                  <metric.icon className={`h-6 w-6 mx-auto ${metric.color}`} />
                  <p className="mt-3 text-3xl font-bold text-[var(--text-primary)]">
                    +{metric.value}%
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">{metric.label}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Scenario Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Side-by-Side Comparison</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table">
                <thead>
                  <tr className="border-b border-[var(--border-primary)]">
                    <th className="pb-3 pr-4 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase">Metric</th>
                    <th className="pb-3 pr-4 text-center text-xs font-semibold text-[var(--text-tertiary)] uppercase">Current Plan</th>
                    <th className="pb-3 pr-4 text-center text-xs font-semibold text-[var(--text-tertiary)] uppercase">AI-Optimized</th>
                    <th className="pb-3 text-center text-xs font-semibold text-[var(--text-tertiary)] uppercase">High-Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { metric: "Budget", values: [formatCurrency(scenarios.baseline.budget), formatCurrency(scenarios.optimized.budget), formatCurrency(scenarios.aggressive.budget)] },
                    { metric: "Projects", values: [scenarios.baseline.projects, scenarios.optimized.projects, scenarios.aggressive.projects] },
                    { metric: "Beneficiaries", values: [`${(scenarios.baseline.beneficiaries / 1000).toFixed(0)}K`, `${(scenarios.optimized.beneficiaries / 1000).toFixed(0)}K`, `${(scenarios.aggressive.beneficiaries / 1000).toFixed(0)}K`] },
                    { metric: "Health +%", values: [`+${scenarios.baseline.healthImprovement}%`, `+${scenarios.optimized.healthImprovement}%`, `+${scenarios.aggressive.healthImprovement}%`] },
                    { metric: "Education +%", values: [`+${scenarios.baseline.educationImprovement}%`, `+${scenarios.optimized.educationImprovement}%`, `+${scenarios.aggressive.educationImprovement}%`] },
                    { metric: "Infra +%", values: [`+${scenarios.baseline.infraImprovement}%`, `+${scenarios.optimized.infraImprovement}%`, `+${scenarios.aggressive.infraImprovement}%`] },
                    { metric: "Satisfaction Δ", values: [`+${scenarios.baseline.satisfactionDelta}`, `+${scenarios.optimized.satisfactionDelta}`, `+${scenarios.aggressive.satisfactionDelta}`] },
                  ].map((row) => (
                    <tr key={row.metric} className="border-b border-[var(--border-primary)] last:border-0">
                      <td className="py-3 pr-4 text-sm font-medium text-[var(--text-primary)]">{row.metric}</td>
                      {row.values.map((val, i) => (
                        <td key={i} className={cn(
                          "py-3 pr-4 text-center text-sm",
                          i === 1 ? "font-semibold text-primary-600" : "text-[var(--text-secondary)]"
                        )}>
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* AI Recommendation */}
          <Card className="border-primary-200 dark:border-primary-800 bg-primary-50/30 dark:bg-primary-900/10">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
                <Sparkles className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">AI Recommendation</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  The <strong>AI-Optimized Plan</strong> delivers the best value-for-money with 27% more beneficiaries
                  than the Current Plan at the same budget. It achieves this by: (1) consolidating 3 small road projects
                  into 1 efficient contract, (2) leveraging PMKSY co-funding for irrigation, (3) phasing healthcare
                  upgrades to reduce upfront costs, and (4) using digital infrastructure as a force multiplier for
                  telemedicine and e-education. The High-Impact Plan requires an additional ₹10 Cr but delivers
                  diminishing returns per rupee spent.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Pre-simulation state */}
      {!simComplete && !simRunning && (
        <Card className="animate-slide-up border-dashed">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Layers3 className="h-16 w-16 text-[var(--text-tertiary)] mb-4" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Select a scenario and run simulation</h3>
            <p className="mt-2 max-w-md text-sm text-[var(--text-secondary)]">
              The Digital Twin uses historical data, demographic indicators, and AI models to predict
              development outcomes under different budget and strategy scenarios.
            </p>
          </div>
        </Card>
      )}

      {/* Running state */}
      {simRunning && (
        <Card className="animate-fade-in">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="relative mb-6">
              <div className="h-20 w-20 rounded-full border-4 border-[var(--border-primary)]" />
              <div className="absolute inset-0 h-20 w-20 rounded-full border-4 border-t-primary-500 animate-spin" />
              <Brain className="absolute inset-0 m-auto h-8 w-8 text-primary-500" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Running Simulation...</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Analyzing {current.projects} projects across {(current.beneficiaries / 1000).toFixed(0)}K beneficiaries
            </p>
            <div className="mt-4 w-64">
              <Progress value={65} barClassName="bg-primary-500" />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
