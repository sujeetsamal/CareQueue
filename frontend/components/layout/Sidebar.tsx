import React from "react";
import {
  LayoutDashboard,
  Users,
  Layers,
  ClipboardList,
  BookOpen,
  Code2,
} from "lucide-react";

export type NavTab = "overview" | "queue" | "recent" | "registry" | "dsa";

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
      label: "Live Dashboard",
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
      id: "recent" as NavTab,
      label: "Recent Calls (Stack)",
      icon: Layers,
      badge: recentCount > 0 ? `${recentCount}` : null,
    },
    {
      id: "registry" as NavTab,
      label: "Patient Registry",
      icon: ClipboardList,
      badge: null,
    },
    {
      id: "dsa" as NavTab,
      label: "DSA Architecture",
      icon: BookOpen,
      badge: "Java",
    },
  ];

  return (
    <aside className="w-full md:w-64 shrink-0 bg-white border-r border-slate-200 md:min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">
            Main Navigation
          </span>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-navy-950 text-white shadow-sm shadow-navy-950/20"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-teal-400" : "text-slate-400"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                        isActive
                          ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                          : "bg-slate-100 text-slate-600"
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

        {/* DSA Quick Reference Card */}
        <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
            <Code2 className="w-4 h-4 text-teal-700" />
            DSA Under the Hood
          </div>
          <p className="text-[11px] text-teal-950/70 leading-relaxed">
            Queue: Custom singly-linked list FIFO with O(1) head/tail pointers.
            <br />
            Stack: Custom singly-linked LIFO with O(1) top pointer.
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
        <div>CareQueue System v1.0</div>
        <div className="text-[10px] text-slate-400 mt-0.5">
          Java 21 · Spring Boot 3 · Next.js 14
        </div>
      </div>
    </aside>
  );
}
