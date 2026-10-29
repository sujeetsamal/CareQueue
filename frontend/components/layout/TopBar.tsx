"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Activity, UserPlus, RefreshCw, Wifi, WifiOff } from "lucide-react";

interface TopBarProps {
  isConnected: boolean;
  onOpenRegister: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function TopBar({
  isConnected,
  onOpenRegister,
  onRefresh,
  isRefreshing = false,
}: TopBarProps) {
  const [currentDateTime, setCurrentDateTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateTime(
        now.toLocaleDateString([], {
          weekday: "short",
          month: "short",
          day: "numeric",
        }) +
          " · " +
          now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-navy-800 bg-white/95 dark:bg-navy-900/95 backdrop-blur-md px-4 sm:px-8 transition-colors duration-200">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-500/30">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Care<span className="text-brand-500">Queue</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            Hospital Patient Queue Management System
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Live Date/Time */}
        <span className="hidden xl:inline-block text-xs font-medium text-slate-500 dark:text-slate-400 font-mono">
          {currentDateTime}
        </span>

        {/* Theme Selector Toggle */}
        <ThemeToggle />

        {/* Connection Status Pill */}
        <div
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
            isConnected
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
          }`}
          title={
            isConnected
              ? "Connected to Spring Boot Java Backend"
              : "Disconnected from Backend. Click refresh to retry."
          }
        >
          {isConnected ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Backend Live</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 animate-pulse" />
              <span className="hidden sm:inline">Disconnected</span>
            </>
          )}
        </div>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="text-xs h-9 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 hover:bg-slate-50 dark:hover:bg-navy-700"
          title="Refresh queue and stats from backend"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-brand-500" : ""}`} />
        </Button>

        {/* Primary Register Patient Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenRegister}
          className="font-semibold shadow-sm h-9 bg-brand-600 hover:bg-brand-700 text-white"
        >
          <UserPlus className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">Register Patient</span>
          <span className="sm:hidden">Register</span>
        </Button>
      </div>
    </header>
  );
}
