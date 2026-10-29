import React from "react";
import { cn } from "@/lib/utils";
import { PatientStatus } from "@/types/patient";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: PatientStatus;
  variant?: "default" | "outline" | "token" | "dept";
}

export function Badge({
  status,
  variant = "default",
  className,
  children,
  ...props
}: BadgeProps) {
  if (status) {
    const statusClasses: Record<PatientStatus, string> = {
      WAITING:
        "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      CALLED:
        "bg-teal-100 dark:bg-brand-950/60 text-teal-800 dark:text-brand-300 border-teal-300 dark:border-brand-700 font-semibold ring-1 ring-teal-400/30",
      COMPLETED:
        "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      CANCELLED:
        "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    };

    return (
      <span
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors",
          statusClasses[status],
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full mr-1.5",
            status === "WAITING" && "bg-amber-500",
            status === "CALLED" && "bg-brand-500 animate-pulse",
            status === "COMPLETED" && "bg-emerald-500",
            status === "CANCELLED" && "bg-rose-500"
          )}
        />
        {status}
      </span>
    );
  }

  if (variant === "token") {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-navy-950 dark:bg-navy-900 text-brand-300 border border-slate-700/50 dark:border-navy-700 tracking-wider shadow-sm",
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }

  if (variant === "dept") {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-700",
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-navy-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-navy-700",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
