import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 sm:px-8">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-navy-950 text-white shadow-sm shadow-brand-600/30">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-black tracking-tight text-navy-950">
              Care<span className="text-brand-600">Queue</span>
            </span>
            <span className="hidden sm:inline-block rounded-md bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold text-teal-700 uppercase tracking-widest border border-teal-200/60">
              DSA Prototype
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Hospital Patient Queue Management System
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Live Date/Time */}
        <span className="hidden lg:inline-block text-xs font-medium text-slate-500 font-mono">
          {currentDateTime}
        </span>

        {/* Connection Status Pill */}
        <div
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
            isConnected
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
          title={
            isConnected
              ? "Connected to Spring Boot Java Backend"
              : "Disconnected from Backend. Click refresh to retry."
          }
        >
          {isConnected ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Backend Live</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-rose-600 animate-pulse" />
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
          className="text-xs text-slate-600 hover:text-slate-900 h-9"
          title="Refresh queue and stats from backend"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-teal-600" : ""}`} />
        </Button>

        {/* Primary Register Patient Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenRegister}
          className="font-semibold shadow-sm h-9"
        >
          <UserPlus className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">Register Patient</span>
          <span className="sm:hidden">Register</span>
        </Button>
      </div>
    </header>
  );
}
