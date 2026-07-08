import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  style?: React.CSSProperties;
}

export function Card({ children, className, hover, glow, style }: CardProps) {
  return (
    <div
      style={style}
      className={cn(
        "rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6",
        "shadow-[var(--shadow-sm)]",
        "transition-all duration-300",
        hover && "hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5",
        glow && "shadow-[var(--shadow-glow)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-4 flex items-center justify-between", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn("text-base font-semibold text-[var(--text-primary)]", className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-sm text-[var(--text-secondary)]", className)}>
      {children}
    </p>
  );
}
