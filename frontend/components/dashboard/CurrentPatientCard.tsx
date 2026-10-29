import React from "react";
import { Patient } from "@/types/patient";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatTime, formatDuration } from "@/lib/utils";
import { Volume2, CheckCircle2, User, Clock, Stethoscope } from "lucide-react";

interface CurrentPatientCardProps {
  currentCall: Patient | null;
  onComplete: (patientId: string) => void;
  onRepeatCall: () => void;
  isActionLoading?: boolean;
}

export function CurrentPatientCard({
  currentCall,
  onComplete,
  onRepeatCall,
  isActionLoading = false,
}: CurrentPatientCardProps) {
  if (!currentCall) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Current Patient Consultation
            </h2>
          </div>
          <Badge variant="outline">Consultation Room Idle</Badge>
        </div>

        <div className="py-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
            <Stethoscope className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-medium text-slate-700">No Patient In Consultation</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            The consultation room is currently open. Click <strong>&quot;Call Next Patient&quot;</strong> in the queue panel to advance the waiting line.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-teal-500/30 bg-gradient-to-br from-white via-teal-50/20 to-white p-6 shadow-md relative overflow-hidden">
      {/* Decorative pulse indicator */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-teal-600 to-teal-400" />

      <div className="flex items-center justify-between pb-4 border-b border-teal-100/60">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-600"></span>
          </span>
          <h2 className="text-sm font-bold uppercase tracking-wider text-teal-900">
            Now In Consultation
          </h2>
        </div>
        <Badge status={currentCall.status} />
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Token Callout */}
        <div className="flex flex-col items-start bg-navy-950 text-white rounded-xl p-4 shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-widest text-teal-400">
            Queue Token
          </span>
          <div className="text-3xl font-mono font-black tracking-wider text-white mt-0.5">
            {currentCall.tokenNumber}
          </div>
          <span className="mt-2 text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            Called at {formatTime(currentCall.calledTime)}
          </span>
        </div>

        {/* Patient Details */}
        <div className="space-y-2">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Patient Name</div>
            <div className="text-lg font-bold text-slate-900 flex items-center gap-2 mt-0.5">
              <User className="w-4 h-4 text-slate-400" />
              {currentCall.name}
              {currentCall.age !== null && (
                <span className="text-xs font-normal text-slate-500">
                  ({currentCall.age} yrs)
                </span>
              )}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Department</div>
            <div className="text-sm font-semibold text-teal-800 flex items-center gap-1.5 mt-0.5">
              <Stethoscope className="w-4 h-4 text-teal-600" />
              {currentCall.department}
            </div>
          </div>

          {currentCall.notes && (
            <div className="text-xs text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-200/60">
              <span className="font-semibold text-slate-700">Note:</span> {currentCall.notes}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 justify-end">
          <Button
            variant="primary"
            size="md"
            className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
            onClick={() => onComplete(currentCall.id)}
            isLoading={isActionLoading}
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Mark Consultation Completed
          </Button>

          <Button
            variant="outline"
            size="md"
            className="w-full text-slate-700 hover:text-slate-900"
            onClick={onRepeatCall}
            disabled={isActionLoading}
          >
            <Volume2 className="w-4 h-4 mr-1.5 text-teal-600" />
            Repeat Announcement
          </Button>
        </div>
      </div>
    </div>
  );
}
