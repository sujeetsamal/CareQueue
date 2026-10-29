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
      card: "border-teal-100 hover:border-teal-200",
      iconBg: "bg-teal-50 text-teal-700",
      accent: "text-teal-700",
    },
    amber: {
      card: "border-amber-100 hover:border-amber-200",
      iconBg: "bg-amber-50 text-amber-700",
      accent: "text-amber-700",
    },
    emerald: {
      card: "border-emerald-100 hover:border-emerald-200",
      iconBg: "bg-emerald-50 text-emerald-700",
      accent: "text-emerald-700",
    },
    slate: {
      card: "border-slate-200 hover:border-slate-300",
      iconBg: "bg-slate-100 text-slate-700",
      accent: "text-slate-700",
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      className={cn(
        "rounded-2xl bg-white p-5 shadow-sm border transition-all duration-200 hover:shadow-md",
        style.card
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className={cn("p-2.5 rounded-xl", style.iconBg)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-500 font-normal">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
