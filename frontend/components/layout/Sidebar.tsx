"use client";

import React from "react";
import { LayoutDashboard, Users, Layers, ClipboardList } from "lucide-react";

export type NavTab = "overview" | "queue" | "recent" | "registry";

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  waitingCount: number;
  recentCount: number;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  waitingCount,
  recentCount,
}: SidebarProps) {
  const navItems = [
    {
      id: "overview" as NavTab,
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "queue" as NavTab,
      label: "Waiting Queue",
      icon: Users,
      badge: waitingCount > 0 ? `${waitingCount}` : null,
    },
    {
      id: "registry" as NavTab,
      label: "Patient Registry",
      icon: ClipboardList,
      badge: null,
    },
    {
      id: "recent" as NavTab,
      label: "Recent Calls",
      icon: Layers,
      badge: recentCount > 0 ? `${recentCount}` : null,
    },
  ];

  return (
    <aside className="w-full md:w-64 shrink-0 bg-white dark:bg-navy-900 border-r border-slate-200 dark:border-navy-800 md:min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between transition-colors duration-200">
      <div className="space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3">
            Operations
          </span>
          <nav className="mt-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-white" : "text-slate-400 dark:text-slate-400"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-100 dark:border-navy-800 text-xs text-slate-400 dark:text-slate-500">
        <div className="font-medium text-slate-600 dark:text-slate-400">CareQueue V2</div>
        <div className="mt-0.5">Hospital Patient Queue Management</div>
      </div>
    </aside>
  );
}
