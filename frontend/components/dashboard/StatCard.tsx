import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "brand" | "amber" | "emerald" | "slate";
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "brand",
}: StatCardProps) {
  const variantStyles = {
    brand: {
      card: "border-slate-200 dark:border-navy-800 hover:border-brand-300 dark:hover:border-brand-700",
      iconBg: "bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400",
    },
    amber: {
      card: "border-slate-200 dark:border-navy-800 hover:border-amber-300 dark:hover:border-amber-700",
      iconBg: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400",
    },
    emerald: {
      card: "border-slate-200 dark:border-navy-800 hover:border-emerald-300 dark:hover:border-emerald-700",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400",
    },
    slate: {
      card: "border-slate-200 dark:border-navy-800 hover:border-slate-300 dark:hover:border-navy-600",
      iconBg: "bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300",
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      className={cn(
        "rounded-2xl bg-white dark:bg-navy-900 p-6 shadow-sm border transition-all duration-200 hover:shadow-md",
        style.card
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className={cn("p-2.5 rounded-xl", style.iconBg)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </div>
        {subtitle && (
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-normal">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
