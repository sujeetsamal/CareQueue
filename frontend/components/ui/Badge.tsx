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
      WAITING: "bg-amber-100 text-amber-800 border-amber-200",
      CALLED: "bg-teal-100 text-teal-800 border-teal-300 font-semibold ring-1 ring-teal-400/30",
      COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200",
      CANCELLED: "bg-rose-100 text-rose-800 border-rose-200",
    };

    return (
      <span
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
          statusClasses[status],
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full mr-1.5",
            status === "WAITING" && "bg-amber-500",
            status === "CALLED" && "bg-teal-600 animate-pulse",
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
          "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-navy-900 text-teal-300 tracking-wider shadow-sm",
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
          "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200",
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
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
