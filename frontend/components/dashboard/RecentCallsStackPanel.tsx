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
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Recent Calls Stack (LIFO)
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                Top: Newest
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Custom Java <code className="font-mono text-indigo-700">RecentCallsStack&lt;Patient&gt;</code>
            </p>
          </div>
        </div>

        {/* Audio Toggle */}
        <button
          onClick={toggleVoice}
          title={voiceEnabled ? "Mute audio announcements" : "Enable voice announcements"}
          className={`p-1.5 rounded-lg border transition-colors ${
            voiceEnabled
              ? "bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100"
              : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"
          }`}
        >
          {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Stack Action Bar */}
      <div className="p-3 bg-slate-50/30 border-b border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium">
          {recentCalls.length} calls in stack history
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onRepeatCall}
          disabled={recentCalls.length === 0 || isRepeating}
          isLoading={isRepeating}
          className="text-xs font-semibold"
        >
          <Volume2 className="w-3.5 h-3.5 mr-1.5 text-teal-600" />
          Repeat Last Call (Peek)
        </Button>
      </div>

      {/* Stack Items */}
      <div className="p-4 flex-1 overflow-y-auto max-h-[380px] space-y-2.5">
        {recentCalls.length === 0 ? (
          <EmptyState
            icon={History}
            title="Stack is Empty"
            description="No patients called yet. When patients are called, they are pushed onto this LIFO stack."
            className="py-8 border-0 bg-transparent"
          />
        ) : (
          recentCalls.map((call, idx) => {
            const isTop = idx === 0;

            return (
              <div
                key={`${call.id}-${idx}`}
                className={`p-3 rounded-xl border transition-all ${
                  isTop
                    ? "bg-indigo-50/40 border-indigo-200 shadow-sm ring-1 ring-indigo-500/10"
                    : "bg-white border-slate-100 hover:border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="token" className={isTop ? "bg-indigo-900" : ""}>
                      {call.tokenNumber}
                    </Badge>
                    {isTop && (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                        STACK TOP
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {formatTime(call.calledTime)}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">
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
