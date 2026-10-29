import React from "react";
import { Patient } from "@/types/patient";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatTime } from "@/lib/utils";
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
      <div className="rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 p-6 shadow-sm transition-colors duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-navy-800">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Current Patient Consultation
            </h2>
          </div>
          <Badge variant="outline">Room Idle</Badge>
        </div>

        <div className="py-10 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 flex items-center justify-center text-slate-400 mb-3.5">
            <Stethoscope className="w-7 h-7 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No Patient In Consultation</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            The consultation room is currently open. Click <strong>&quot;Call Next Patient&quot;</strong> in the queue panel to advance the waiting line.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-brand-500/40 bg-gradient-to-br from-white via-brand-50/10 to-white dark:from-navy-900 dark:via-navy-900 dark:to-navy-950 p-6 shadow-md relative overflow-hidden transition-colors duration-200">
      {/* Decorative top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-400 via-brand-500 to-teal-400" />

      <div className="flex items-center justify-between pb-4 border-b border-brand-100/60 dark:border-navy-800">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-600 dark:bg-brand-400"></span>
          </span>
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-900 dark:text-brand-300">
            Now In Consultation
          </h2>
        </div>
        <Badge status={currentCall.status} />
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        {/* Token Callout */}
        <div className="flex flex-col items-start bg-navy-950 text-white rounded-xl p-5 shadow-sm border border-navy-800">
          <span className="text-xs font-mono uppercase tracking-widest text-brand-400">
            Queue Token
          </span>
          <div className="text-4xl font-mono font-extrabold tracking-wider text-white mt-1">
            {currentCall.tokenNumber}
          </div>
          <span className="mt-2.5 text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-brand-400" />
            Called at {formatTime(currentCall.calledTime)}
          </span>
        </div>

        {/* Patient Details */}
        <div className="space-y-3">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Patient Name</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
              <User className="w-5 h-5 text-slate-400" />
              {currentCall.name}
              {currentCall.age !== null && (
                <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                  ({currentCall.age} yrs)
                </span>
              )}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Department</div>
            <div className="text-base font-semibold text-brand-700 dark:text-brand-300 flex items-center gap-1.5 mt-0.5">
              <Stethoscope className="w-4 h-4 text-brand-500" />
              {currentCall.department}
            </div>
          </div>

          {currentCall.notes && (
            <div className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-navy-800 p-2.5 rounded-lg border border-slate-200 dark:border-navy-700">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Note:</span> {currentCall.notes}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 justify-end">
          <Button
            variant="primary"
            size="md"
            className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 text-white font-semibold"
            onClick={() => onComplete(currentCall.id)}
            isLoading={isActionLoading}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark Consultation Completed
          </Button>

          <Button
            variant="outline"
            size="md"
            className="w-full text-slate-700 dark:text-slate-200 border-slate-300 dark:border-navy-700 hover:bg-slate-50 dark:hover:bg-navy-800"
            onClick={onRepeatCall}
            disabled={isActionLoading}
          >
            <Volume2 className="w-4 h-4 mr-2 text-brand-600 dark:text-brand-400" />
            Repeat Announcement
          </Button>
        </div>
      </div>
    </div>
  );
}
