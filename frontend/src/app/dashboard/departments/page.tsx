"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Building2, CheckCircle, Clock, AlertTriangle, Users } from "lucide-react";

const departments = [
  { name: "Public Health Engineering", abbr: "PHE", projects: 5, completed: 3, pending: 2, responseTime: 3.2, satisfaction: 78 },
  { name: "Public Works Department", abbr: "PWD", projects: 8, completed: 5, pending: 3, responseTime: 5.1, satisfaction: 65 },
  { name: "Education Department", abbr: "EDU", projects: 6, completed: 4, pending: 2, responseTime: 4.5, satisfaction: 72 },
  { name: "Agriculture Department", abbr: "AGR", projects: 4, completed: 2, pending: 2, responseTime: 6.8, satisfaction: 58 },
  { name: "Rural Development", abbr: "RD", projects: 7, completed: 5, pending: 2, responseTime: 3.8, satisfaction: 75 },
  { name: "Health & Family Welfare", abbr: "H&FW", projects: 5, completed: 3, pending: 2, responseTime: 4.2, satisfaction: 70 },
  { name: "IT & Communications", abbr: "IT", projects: 3, completed: 2, pending: 1, responseTime: 2.5, satisfaction: 82 },
  { name: "Energy Department", abbr: "ENR", projects: 3, completed: 1, pending: 2, responseTime: 7.2, satisfaction: 55 },
];

export default function DepartmentsPage() {
  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
            <Building2 className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Government Departments</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Inter-departmental coordination, task tracking, and performance monitoring
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {departments.map((dept, i) => (
          <Card
            key={dept.abbr}
            hover
            className="animate-slide-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
                <span className="text-xs font-bold text-primary-700 dark:text-primary-400">{dept.abbr}</span>
              </div>
              <Badge
                variant={dept.satisfaction >= 70 ? "success" : dept.satisfaction >= 60 ? "warning" : "danger"}
                size="sm"
              >
                {dept.satisfaction}% sat.
              </Badge>
            </div>

            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{dept.name}</h3>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-[var(--text-tertiary)]">
                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                  Completed
                </span>
                <span className="font-medium text-[var(--text-primary)]">{dept.completed}/{dept.projects}</span>
              </div>
              <Progress value={(dept.completed / dept.projects) * 100} size="sm" barClassName="bg-emerald-500" />

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-[var(--text-tertiary)]">
                  <Clock className="h-3 w-3 text-amber-500" />
                  Avg Response
                </span>
                <span className={cn(
                  "font-medium",
                  dept.responseTime <= 4 ? "text-emerald-600" :
                  dept.responseTime <= 6 ? "text-amber-600" : "text-red-600"
                )}>
                  {dept.responseTime} days
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-[var(--text-tertiary)]">
                  <AlertTriangle className="h-3 w-3 text-orange-500" />
                  Pending
                </span>
                <span className="font-medium text-[var(--text-primary)]">{dept.pending} tasks</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
