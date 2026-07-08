"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface ScoreRingProps {
  score: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
  color?: string;
}

export function ScoreRing({
  score,
  max = 100,
  size = 80,
  strokeWidth = 6,
  className,
  label,
  color,
}: ScoreRingProps) {
  const safeScore = Number(score) || 0;
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = (animatedScore / max) * 100;
  const offset = circumference - (percentage / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(safeScore), 100);
    return () => clearTimeout(timer);
  }, [safeScore]);

  const getColor = () => {
    if (color) return color;
    if (percentage >= 80) return "#22C55E";
    if (percentage >= 60) return "#F59E0B";
    if (percentage >= 40) return "#F97316";
    return "#EF4444";
  };

  return (
    <div className={cn("relative inline-flex flex-col items-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-primary)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="score-ring"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-[var(--text-primary)]">
          {animatedScore.toFixed(0)}
        </span>
      </div>
      {label && (
        <span className="mt-1.5 text-xs font-medium text-[var(--text-tertiary)]">
          {label}
        </span>
      )}
    </div>
  );
}
