import React, { useState } from "react";
import { Patient } from "@/types/patient";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatTime } from "@/lib/utils";
import { Layers, Volume2, VolumeX, History, Clock } from "lucide-react";

interface RecentCallsStackPanelProps {
  recentCalls: Patient[];
  onRepeatCall: () => void;
  isRepeating?: boolean;
}

export function RecentCallsStackPanel({
  recentCalls,
  onRepeatCall,
  isRepeating = false,
}: RecentCallsStackPanelProps) {
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (!voiceEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance("Voice announcements enabled for CareQueue.");
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm overflow-hidden flex flex-col h-full transition-colors duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-navy-800 flex items-center justify-between bg-slate-50/50 dark:bg-navy-950/40">
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Recent Calls
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                Newest First
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Chronological consultation call history
            </p>
          </div>
        </div>

        {/* Audio Toggle */}
        <button
          onClick={toggleVoice}
          title={voiceEnabled ? "Mute audio announcements" : "Enable voice announcements"}
          className={`p-2 rounded-lg border transition-colors ${
            voiceEnabled
              ? "bg-brand-50 dark:bg-brand-950/60 border-brand-200 dark:border-brand-700 text-brand-700 dark:text-brand-300"
              : "bg-slate-100 dark:bg-navy-800 border-slate-200 dark:border-navy-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-navy-700"
          }`}
        >
          {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Stack Action Bar */}
      <div className="p-3 bg-slate-50/30 dark:bg-navy-950/20 border-b border-slate-100 dark:border-navy-800 flex items-center justify-between">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {recentCalls.length} calls in history
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onRepeatCall}
          disabled={recentCalls.length === 0 || isRepeating}
          isLoading={isRepeating}
          className="text-xs font-semibold"
        >
          <Volume2 className="w-3.5 h-3.5 mr-1.5 text-brand-600 dark:text-brand-400" />
          Repeat Last Call
        </Button>
      </div>

      {/* Stack Items */}
      <div className="p-4 flex-1 overflow-y-auto max-h-[380px] space-y-2.5">
        {recentCalls.length === 0 ? (
          <EmptyState
            icon={History}
            title="No Recent Calls"
            description="When patients are called, their announcements appear here in reverse-chronological order."
            className="py-8 border-0 bg-transparent"
          />
        ) : (
          recentCalls.map((call, idx) => {
            const isTop = idx === 0;

            return (
              <div
                key={`${call.id}-${idx}`}
                className={`p-3.5 rounded-xl border transition-all ${
                  isTop
                    ? "bg-brand-50/40 dark:bg-brand-950/30 border-brand-200 dark:border-brand-800 shadow-sm ring-1 ring-brand-500/10"
                    : "bg-white dark:bg-navy-900 border-slate-100 dark:border-navy-800 hover:border-slate-200 dark:hover:border-navy-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="token" className={isTop ? "bg-navy-950 dark:bg-navy-950" : ""}>
                      {call.tokenNumber}
                    </Badge>
                    {isTop && (
                      <span className="text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-100 dark:bg-brand-950/80 px-2 py-0.5 rounded">
                        LATEST CALL
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(call.calledTime)}
                  </span>
                </div>

                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {call.name}
                  </span>
                  <Badge variant="dept">{call.department}</Badge>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
