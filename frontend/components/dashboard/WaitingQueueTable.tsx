import React from "react";
import { Patient } from "@/types/patient";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatTime, formatDuration } from "@/lib/utils";
import { Users, PhoneCall, XCircle, Clock, ArrowRight } from "lucide-react";

interface WaitingQueueTableProps {
  queue: Patient[];
  onCallNext: () => void;
  onCancelPatient: (patient: Patient) => void;
  isCallingNext?: boolean;
}

export function WaitingQueueTable({
  queue,
  onCallNext,
  onCancelPatient,
  isCallingNext = false,
}: WaitingQueueTableProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-700" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Waiting Queue (FIFO Order)
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-800">
              {queue.length} Waiting
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Managed by Java <code className="font-mono text-teal-700 bg-teal-50 px-1 py-0.5 rounded">LinkedPatientQueue</code> in first-in, first-out sequence.
          </p>
        </div>

        {/* Primary Call Next Button */}
        <Button
          variant="primary"
          size="md"
          onClick={onCallNext}
          disabled={queue.length === 0 || isCallingNext}
          isLoading={isCallingNext}
          className="shrink-0 font-semibold"
        >
          <PhoneCall className="w-4 h-4 mr-2" />
          Call Next Patient
        </Button>
      </div>

      {/* Body: Empty State or Queue List */}
      {queue.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Patients Waiting"
          description="All registered patients have been called or completed. Register new patients using the button in the header."
          className="m-6 border-0 bg-transparent"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Position</th>
                <th className="py-3 px-4">Token</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Registered At</th>
                <th className="py-3 px-4">Wait Time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {queue.map((patient, index) => {
                const isNext = index === 0;

                return (
                  <tr
                    key={patient.id}
                    className={`transition-colors ${
                      isNext
                        ? "bg-teal-50/40 hover:bg-teal-50/60 font-medium"
                        : "hover:bg-slate-50/80"
                    }`}
                  >
                    {/* Position */}
                    <td className="py-3.5 px-4">
                      {isNext ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full ring-1 ring-teal-400/30">
                          <span>#1 Next</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">
                          #{patient.queuePosition || index + 1}
                        </span>
                      )}
                    </td>

                    {/* Token */}
                    <td className="py-3.5 px-4">
                      <Badge variant="token">{patient.tokenNumber}</Badge>
                    </td>

                    {/* Patient Name */}
                    <td className="py-3.5 px-4 text-slate-900">
                      <div className="font-semibold">{patient.name}</div>
                      {patient.age !== null && (
                        <div className="text-xs text-slate-400 font-normal">
                          {patient.age} years old
                        </div>
                      )}
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4">
                      <Badge variant="dept">{patient.department}</Badge>
                    </td>

                    {/* Registered At */}
                    <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatTime(patient.registrationTime)}
                    </td>

                    {/* Wait Duration */}
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-600 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatDuration(patient.waitDurationSeconds)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {isNext && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={onCallNext}
                            disabled={isCallingNext}
                            isLoading={isCallingNext}
                            className="bg-brand-600 hover:bg-brand-700"
                          >
                            <PhoneCall className="w-3.5 h-3.5 mr-1" />
                            Call
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCancelPatient(patient)}
                          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Cancel waiting entry"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
