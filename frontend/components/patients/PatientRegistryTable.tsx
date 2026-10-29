import React, { useState, useMemo } from "react";
import { Patient, PatientStatus } from "@/types/patient";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatTime, formatDate, DEPARTMENTS } from "@/lib/utils";
import { Search, Filter, ClipboardList, X } from "lucide-react";

interface PatientRegistryTableProps {
  patients: Patient[];
  onRefresh?: () => void;
}

export function PatientRegistryTable({ patients }: PatientRegistryTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<PatientStatus | "ALL">("ALL");

  const statusCounts = useMemo(() => {
    return {
      ALL: patients.length,
      WAITING: patients.filter((p) => p.status === "WAITING").length,
      CALLED: patients.filter((p) => p.status === "CALLED").length,
      COMPLETED: patients.filter((p) => p.status === "COMPLETED").length,
      CANCELLED: patients.filter((p) => p.status === "CANCELLED").length,
    };
  }, [patients]);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      // Search match
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesToken = p.tokenNumber.toLowerCase().includes(query);
        if (!matchesName && !matchesToken) return false;
      }

      // Department filter
      if (selectedDept !== "ALL" && p.department !== selectedDept) {
        return false;
      }

      // Status filter
      if (selectedStatus !== "ALL" && p.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [patients, searchTerm, selectedDept, selectedStatus]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDept("ALL");
    setSelectedStatus("ALL");
  };

  const hasActiveFilters = searchTerm !== "" || selectedDept !== "ALL" || selectedStatus !== "ALL";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Search & Filter Header */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-teal-700" />
              Patient Registry & Database Records
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Persistent storage in PostgreSQL. Search and filter across all historical patient states.
            </p>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-teal-700 hover:text-teal-900 font-medium inline-flex items-center gap-1 self-start sm:self-auto"
            >
              <X className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by patient name or token (e.g. CQ-101)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Department Select */}
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">All Departments</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60">
          {(["ALL", "WAITING", "CALLED", "COMPLETED", "CANCELLED"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedStatus === status
                  ? "bg-navy-950 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {status === "ALL" ? "All Patients" : status}
              <span
                className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                  selectedStatus === status
                    ? "bg-teal-500 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {statusCounts[status]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      {filteredPatients.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No Matching Records"
          description="No patients match your current search and filter criteria. Try adjusting your query or resetting filters."
          action={
            hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="text-xs text-brand-700 font-semibold hover:underline"
              >
                Reset all filters
              </button>
            ) : undefined
          }
          className="m-6 border-0 bg-transparent"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Token</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Registration</th>
                <th className="py-3 px-4">Called</th>
                <th className="py-3 px-4">Completed</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <Badge variant="token">{patient.tokenNumber}</Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-900 font-semibold">
                    {patient.name}
                    {patient.age !== null && (
                      <span className="text-xs font-normal text-slate-400 ml-1">
                        ({patient.age}y)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="dept">{patient.department}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge status={patient.status} />
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                    <div>{formatDate(patient.registrationTime)}</div>
                    <div className="text-[11px] text-slate-400">
                      {formatTime(patient.registrationTime)}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                    {formatTime(patient.calledTime)}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                    {formatTime(patient.completedTime)}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate">
                    {patient.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
